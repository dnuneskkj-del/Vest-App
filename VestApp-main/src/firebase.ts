import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged as fbOnAuthStateChanged, signOut as fbSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, linkWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, serverTimestamp, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import { toast } from 'sonner';

// Initialize Firebase
let app, auth, db, storage;
try {
  console.log("Configurando Firebase com ProjectID:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  console.log("API Key (prefix):", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 7) + "..." : "N/A");
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Use the specific database ID if provided, otherwise default
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
  storage = getStorage(app);
  storage.maxUploadRetryTime = 3000; // Fail quickly if CORS/auth fails
  storage.maxOperationRetryTime = 3000;
  console.log("Firebase inicializado com sucesso");
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
}

export { auth, db, storage };
const googleProvider = new GoogleAuthProvider();

// Auth helper functions
export const onAuthStateChanged = (authInstance: any, next: any, error?: any, completed?: any) => {
  if (!authInstance) {
    console.warn("safe onAuthStateChanged: authInstance is not initialized");
    return () => {};
  }
  return fbOnAuthStateChanged(authInstance, next, error, completed);
};

export const signOut = (authInstance: any) => {
  if (!authInstance) {
    console.warn("safe signOut: authInstance is not initialized");
    return Promise.resolve();
  }
  return fbSignOut(authInstance);
};

export const signInWithGoogle = async () => {
  try {
    if (!auth) throw new Error("Firebase Auth não inicializado");
    console.log("Iniciando signInWithPopup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Login bem-sucedido:", result.user.email);
    return result.user;
  } catch (error: any) {
    console.error("Erro detalhado no signInWithGoogle:", error);
    if (error.code === 'auth/popup-blocked') {
      toast.error("O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.");
    } else if (error.code === 'auth/operation-not-allowed') {
      toast.error("O login com Google não está ativado no console do Firebase.");
    } else {
      toast.error("Erro ao entrar com Google: " + error.message);
    }
    throw error;
  }
};

export const signUpWithEmail = (email: string, password: string) => {
  if (!auth) throw new Error("Firebase Auth não inicializado");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = (email: string, password: string) => {
  if (!auth) throw new Error("Firebase Auth não inicializado");
  return signInWithEmailAndPassword(auth, email, password);
};

export const resetPassword = (email: string) => {
  if (!auth) throw new Error("Firebase Auth não inicializado");
  return sendPasswordResetEmail(auth, email);
};

export const logout = () => {
  if (!auth) throw new Error("Firebase Auth não inicializado");
  return logoutHelper();
};

const logoutHelper = () => {
  if (auth) return signOut(auth);
};

export const updatePresence = async (status: 'online' | 'offline') => {
  if (!auth || !auth.currentUser || !db) return;
  const presenceRef = doc(db, 'presence', auth.currentUser.uid);
  try {
    await setDoc(presenceRef, {
      uid: auth.currentUser.uid,
      status,
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Erro ao atualizar presença:", error);
  }
};

export const saveSimuladoResult = async (result: {
  userId: string;
  email: string;
  materia: string;
  total: number;
  correct: number;
  percentage: number;
  date: any;
}) => {
  if (!db) throw new Error("Firebase não inicializado");
  
  // Use a unique ID based on user and timestamp
  const docId = `${result.userId}_${Date.now()}`;
  const docRef = doc(db, 'simulados_historico', docId);
  
  try {
    await setDoc(docRef, {
      ...result,
      createdAt: serverTimestamp()
    });
    console.log("Resultado salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar resultado:", error);
    throw error;
  }
};

export const getSimuladoHistory = async (userId: string) => {
  if (!db) throw new Error("Firebase não inicializado");
  
  const historyRef = collection(db, 'simulados_historico');
  const q = query(historyRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  
  try {
    const querySnapshot = await getDocs(q);
    const results: any[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    throw error;
  }
};

// Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // If it's a "Missing or insufficient permissions" error, check if the user is actually authenticated
  // Sometimes this error fires during auth state transitions before the token is fully ready.
  const isPermissionError = error instanceof Error && error.message.includes('insufficient permissions');
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }

  // Log the error for debugging
  console.error('Firestore Error Details:', {
    operation: operationType,
    path: path,
    authenticated: !!auth.currentUser,
    uid: auth.currentUser?.uid,
    originalError: error
  });

  if (error instanceof Error && (error.message.includes('Quota limit exceeded') || error.message.includes('Quota exceeded'))) {
    console.warn("Aviso: Quota Excedida no Firestore. O aplicativo pode não salvar ou carregar novos dados.");
    // Supressing toast to not bother the user continuously
    throw new Error("Quota exceeded.");
  }

  // If it's a permission error and the user is NOT authenticated, it's expected but we should still log it.
  // If the user IS authenticated but still gets this error, it's a real rules issue.
  if (isPermissionError) {
    if (!auth.currentUser) {
      console.warn(`Tentativa de operação ${operationType} em ${path} sem autenticação ativa.`);
    } else {
      console.error(`ERRO DE PERMISSÃO: O usuário ${auth.currentUser.uid} não tem permissão para ${operationType} em ${path}. Verifique as regras do Firestore.`);
    }
  }

  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore
async function testConnection() {
  // Wait a bit before testing to allow initial connection handshake
  await new Promise(resolve => setTimeout(resolve, 2000));
  try {
    if (db) {
      console.log("Testando conexão com Firestore...");
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log("Conexão com Firestore confirmada!");
    }
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Erro de conexão Firestore: O cliente está offline. Verifique sua conexão ou configuração do Firebase.");
    } else {
      // Outros erros podem ser normais se o documento não existir, mas o 'unavailable' é o que queremos monitorar
      console.log("Teste de conexão finalizado (documento de teste pode não existir, o que é normal).");
    }
  }
}
testConnection();

// Auto-migration helper for users affected by the custom database transition
export const checkAndMigrateUser = async (uid: string) => {
  if (!db || !app || !firebaseConfig.firestoreDatabaseId) {
    console.log("Migração não aplicável: Banco customizado não configurado.");
    return;
  }
  
  try {
    // 1. Verificações no banco customizado atual
    const userRefCustom = doc(db, 'users', uid);
    const snapCustom = await getDocFromServer(userRefCustom).catch(() => null);
    
    // Se o usuário já existe e possui progresso real no banco atual, evitamos sobregravar.
    if (snapCustom && snapCustom.exists()) {
      const data = snapCustom.data();
      if ((data.xp && data.xp > 50) || (data.level && data.level > 1) || data.migratedFromDefault) {
        console.log("Usuário já ativo no banco customizado com progresso. Pulando migração.");
        return;
      }
    }

    console.log("Iniciando verificação de conta legada no banco '(default)'...");
    
    // 2. Conectar ao banco '(default)' de forma segura
    const dbDefault = getFirestore(app, "(default)");
    const userRefDefault = doc(dbDefault, 'users', uid);
    const snapDefault = await getDocFromServer(userRefDefault).catch(() => null);

    if (snapDefault && snapDefault.exists()) {
      const legacyProfile = snapDefault.data();
      console.log("Dados legados encontrados no banco '(default)'!", legacyProfile);
      
      toast.loading("Restaurando seus dados anteriores do VestApp...", { id: "migration-toast" });

      // Migrar documento principal de perfil
      await setDoc(userRefCustom, {
        ...legacyProfile,
        migratedFromDefault: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Migrar cronogramas
      try {
        const schedRefDefault = doc(dbDefault, 'schedules', uid);
        const snapSched = await getDocFromServer(schedRefDefault).catch(() => null);
        if (snapSched && snapSched.exists()) {
          const schedRefCustom = doc(db, 'schedules', uid);
          await setDoc(schedRefCustom, snapSched.data(), { merge: true });
          console.log("Cronograma migrado.");
        }
      } catch (err) {
        console.warn("Erro ao migrar cronograma:", err);
      }

      // Migrar resultados de simulados (simulado_results)
      try {
        const simRefDefault = collection(dbDefault, 'simulado_results');
        const qSim = query(simRefDefault, where('userId', '==', uid));
        const snapSim = await getDocs(qSim);
        for (const docSnap of snapSim.docs) {
          const docRefCustom = doc(db, 'simulado_results', docSnap.id);
          await setDoc(docRefCustom, docSnap.data(), { merge: true });
        }
        console.log(`${snapSim.size} simulados migrados.`);
      } catch (err) {
        console.warn("Erro ao migrar simulados:", err);
      }

      // Migrar histórico de simulados (simulados_historico)
      try {
        const histRefDefault = collection(dbDefault, 'simulados_historico');
        const qHist = query(histRefDefault, where('userId', '==', uid));
        const snapHist = await getDocs(qHist);
        for (const docSnap of snapHist.docs) {
          const docRefCustom = doc(db, 'simulados_historico', docSnap.id);
          await setDoc(docRefCustom, docSnap.data(), { merge: true });
        }
        console.log(`${snapHist.size} históricos de simulado migrados.`);
      } catch (err) {
        console.warn("Erro ao migrar histórico de simulados:", err);
      }

      // Migrar redações enviadas (essay_submissions)
      try {
        const essayRefDefault = collection(dbDefault, 'essay_submissions');
        const qEssay = query(essayRefDefault, where('userId', '==', uid));
        const snapEssay = await getDocs(qEssay);
        for (const docSnap of snapEssay.docs) {
          const docRefCustom = doc(db, 'essay_submissions', docSnap.id);
          await setDoc(docRefCustom, docSnap.data(), { merge: true });
        }
        console.log(`${snapEssay.size} redações migradas.`);
      } catch (err) {
        console.warn("Erro ao migrar redações:", err);
      }

      // Migrar postagens do feed (posts)
      try {
        const postsRefDefault = collection(dbDefault, 'posts');
        const qPosts = query(postsRefDefault, where('authorId', '==', uid));
        const snapPosts = await getDocs(qPosts);
        for (const docSnap of snapPosts.docs) {
          const docRefCustom = doc(db, 'posts', docSnap.id);
          await setDoc(docRefCustom, docSnap.data(), { merge: true });
        }
        console.log(`${snapPosts.size} posts migrados.`);
      } catch (err) {
        console.warn("Erro ao migrar posts:", err);
      }

      toast.success("Todos os seus dados de estudos, progresso de jogos, XP e redações foram totalmente restaurados! 🎉", { 
        id: "migration-toast",
        duration: 8000 
      });
      
      // Forçar recarregamento da página após migração para atualizar todos os componentes em tempo real
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } else {
      console.log("Nenhum dado legado encontrado no banco '(default)'.");
    }
  } catch (error) {
    console.error("Erro no processo de migração:", error);
    toast.dismiss("migration-toast");
  }
};

