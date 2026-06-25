import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, signInWithGoogle, onAuthStateChanged, signUpWithEmail, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, AtSign, Mail, Lock, Calendar, Chrome, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import Countdown from '../components/Countdown';
import InteractiveBackground from '../components/InteractiveBackground';
import { safeLocalStorage } from '../lib/storage';

export default function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGmail, setIsGmail] = useState(false);
  const [eyeGlow, setEyeGlow] = useState(false);
  const navigate = useNavigate();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light-mode', 'dark-mode', 'dark');
    root.classList.add(`${theme}-mode`);
    if (theme === 'dark') {
      root.classList.add('dark');
    }
    safeLocalStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = safeLocalStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/perfil');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setIsGmail(val.toLowerCase().endsWith('@gmail.com'));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setEyeGlow(true);
    
    try {
      const userCredential = await signUpWithEmail(email, password);
      const user = userCredential.user;

      // Save additional profile data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: name,
        handle: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: email,
        birthdate: birthdate,
        createdAt: serverTimestamp(),
        xp: 0,
        level: 1,
        photoURL: '',
        avatarEdited: false,
        bio: 'Novo estudante no VestApp! 🎓',
        followers: [],
        following: [],
        isVerified: false,
        achievements: [],
        stats: {
          posts: 0,
          comments: 0,
          likes: 0
        }
      });

      setEyeGlow(false);
      navigate('/perfil');
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      let message = "Erro ao criar conta. Verifique seus dados.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      if (error.code === 'auth/weak-password') message = "A senha deve ter pelo menos 6 caracteres.";
      if (error.code === 'auth/invalid-email') message = "E-mail inválido.";
      if (error.code === 'auth/too-many-requests') message = "Muitas tentativas detectadas. Por favor, tente novamente mais tarde.";
      if (error.code === 'auth/operation-not-allowed') message = "O cadastro com e-mail/senha não está ativado no Firebase Console.";
      
      toast.error(message);
      setEyeGlow(false);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setEyeGlow(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        navigate('/perfil');
      } else {
        setLoading(false);
        setEyeGlow(false);
      }
    } catch (error: any) {
      console.error("Erro no login do Google:", error);
      toast.error(
        "Erro ao se cadastrar com Google (bloqueado pelo iframe). Para resolver, abra o app em uma Nova Guia (no botão do topo direito) ou use o cadastro de E-mail e Senha abaixo.",
        { duration: 10000 }
      );
      setEyeGlow(false);
      setLoading(false);
    }
  };

  return (
    <div className="register-page-container relative overflow-hidden">
      <InteractiveBackground />
      <section className="main-hero relative z-10">
        <div className={`login-container ${theme}-mode bg-white dark:bg-[#0a0a0c] lg:bg-gradient-to-br lg:from-blue-50 lg:to-white lg:dark:from-[#0a0a0c] lg:dark:to-[#000000]`}>
          <div className="left-side">
            <div className="content-wrapper">
              <div className="chat-bubble" id="vest-message">
                Olá! Eu sou o <strong>Vest</strong>. <br />Bora conquistar essa vaga? 🚀
              </div>

              <div className={`mascote-container ${eyeGlow ? 'eye-glow-active' : ''}`}>
                <img 
                  src="/Vestapp/img/vest.png" 
                  className="mascote" 
                  alt="Mascote VestApp" 
                />
                <div className="eye eye-left"></div>
                <div className="eye eye-right"></div>
                <div className="glow-effect"></div>
              </div>

              <div className="brand-text">
                <h1>Vest<span>App</span></h1>
              </div>

              <div className="mini-features">
                <div className="feature-item">
                  <Calendar size={20} />
                  <span>Cronograma Inteligente</span>
                </div>
                <div className="feature-item">
                  <Rocket size={20} />
                  <span>IA que faz seu cronograma</span>
                </div>
                <div className="feature-item">
                  <User size={20} />
                  <span>Análise de Desempenho</span>
                </div>
              </div>
            </div>
          </div>

          <div className="right-side">
            <div className="card animate-fade-in">
              <div className="header">
                <h2>Crie sua conta 🎓</h2>
                <p>Preencha os dados para começar.</p>
                <Countdown title="Faltam para o ENEM" />
              </div>
              <form onSubmit={handleRegister}>
                <div className="input-row">
                  <div className="input-group">
                    <User className="input-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="Nome" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <AtSign className="input-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="Usuário" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="input-group">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    placeholder="E-mail" 
                    value={email}
                    onChange={handleEmailChange}
                    required 
                  />
                </div>

                {isGmail && (
                  <div className="gmail-notice animate-fade-in" style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--accent-1)', 
                    marginBottom: '10px', 
                    padding: '8px', 
                    background: 'rgba(255, 107, 0, 0.1)', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Chrome size={14} />
                    <span>Conta Gmail detectada. Você pode usar o Google ou criar uma senha.</span>
                  </div>
                )}

                <div className="input-row">
                  <div className="input-group">
                    <Lock className="input-icon" size={18} />
                    <input 
                      type="password" 
                      placeholder="Senha" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="input-group">
                    <Calendar className="input-icon" size={18} />
                    <input 
                      type="date" 
                      placeholder="Nascimento" 
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      required 
                      className="w-full"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="btn-main"
                  disabled={loading}
                >
                  Começar Agora
                </button>

                <div className="divider">
                  <span>ou</span>
                </div>

                <button 
                  type="button" 
                  className="btn-google" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <Chrome size={20} />
                  Cadastrar com Google
                </button>
              </form>
              <div className="footer-actions" style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ marginBottom: '10px', color: 'rgba(255,255,255,0.6)' }}>Já é um corvo experiente?</p>
                <Link to="/login" className="btn-secondary" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  color: 'white',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }}>
                  <Mail size={18} />
                  Fazer login agora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
