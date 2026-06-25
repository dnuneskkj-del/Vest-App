import React, { useState, useEffect, useLayoutEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, signOut, updatePresence, db, handleFirestoreError, OperationType, onAuthStateChanged, checkAndMigrateUser } from '../firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs, doc, getDoc, setDoc, serverTimestamp, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { User, Gamepad, FileSignature, FileText, Home, Bot, LogOut, Plus, Eye, Code, Calendar, Settings as SettingsIcon, TrendingUp, Bell, X, Menu } from 'lucide-react';
import { toast } from 'sonner';
import InteractiveBackground from './InteractiveBackground';
import ProfileOverlay from './ProfileOverlay';
import { AnimatePresence, motion } from 'motion/react';
import { safeLocalStorage } from '../lib/storage';
import UserAvatar from './UserAvatar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = safeLocalStorage.getItem('theme');
    return savedTheme !== 'light'; // Default to true if null or 'dark'
  });
  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('none');
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large' | 'extra-large'>('normal');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [viewingProfileUid, setViewingProfileUid] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Function to apply theme consistently
  const updateColorVariables = (isDark: boolean, currentTheme?: string) => {
    const root = document.documentElement;
    const activeColor = safeLocalStorage.getItem('light-theme-color') || 'default';
    
    const hexToRgb = (hex: string) => {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    };
    
    if (isDark) {
      root.style.setProperty('--bg-main', '#09090b');
      root.style.setProperty('--bg-secondary', '#111115');
      root.style.setProperty('--glass-bg', 'rgba(15, 15, 20, 0.7)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.08)');
    } else {
      root.style.setProperty('--bg-main', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.8)');
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.08)');
    }
    
    const hexToRgba = (hex: string, alpha: number) => {
      return `rgba(${hexToRgb(hex)}, ${alpha})`;
    };

    let targetColor = '#3b82f6';
    let accent2Color = '#1d4ed8';

    if (isDark) {
      // Dark Mode accent colors - Classic and Deep Blue visibility
      const darkThemeColors: Record<string, string> = {
        '#fc77b2': '#fc77b2', // Original Pink
        '#00bef2': '#00bef2', // Original Cyan/Blue
        '#fff461': '#fff461', // Original Yellow
        '#36ae68': '#36ae68', // Original Green
        'default': '#818cf8', // Original Deep Indigo
      };
      
      const darkThemeColors2: Record<string, string> = {
        '#fc77b2': '#f472b6',
        '#00bef2': '#38bdf8',
        '#fff461': '#facc15',
        '#36ae68': '#4ade80',
        'default': '#a78bfa',
      };

      targetColor = darkThemeColors[activeColor] || darkThemeColors['default'];
      accent2Color = darkThemeColors2[activeColor] || darkThemeColors2['default'];

      root.style.setProperty('--accent-1', targetColor);
      root.style.setProperty('--accent-2', accent2Color);
      root.style.setProperty('--accent-rgb', hexToRgb(targetColor));
      
      root.style.setProperty('--accent-1-05', hexToRgba(targetColor, 0.05));
      root.style.setProperty('--accent-1-08', hexToRgba(targetColor, 0.08));
      root.style.setProperty('--accent-1-10', hexToRgba(targetColor, 0.10));
      root.style.setProperty('--accent-1-15', hexToRgba(targetColor, 0.15));
      root.style.setProperty('--accent-1-20', hexToRgba(targetColor, 0.20));
      root.style.setProperty('--accent-1-30', hexToRgba(targetColor, 0.30));
      root.style.setProperty('--accent-1-40', hexToRgba(targetColor, 0.40));

      // Slightly tweak dark mode backgrounds and custom values based on active color to give an immersive atmosphere
      let bgMainVal = '#0a0a0c';
      let bgSecondaryVal = '#16161a';
      let cardBorderVal = 'rgba(255, 255, 255, 0.06)';
      let glassVal = 'rgba(10, 10, 12, 0.95)';
      let glassBorderVal = 'rgba(255, 255, 255, 0.04)';
      let cardShadowVal = '0 10px 40px -10px rgba(0, 0, 0, 0.7)';
      let simuladoProColorVal = targetColor;
      let menuBgVal = 'rgba(10, 10, 12, 0.95)';

      if (activeColor !== 'default') {
        // Embed very subtle theme colors into the dark glass walls and gradients
        cardBorderVal = hexToRgba(targetColor, 0.15);
        glassBorderVal = hexToRgba(targetColor, 0.10);
        cardShadowVal = `0 15px 50px -15px ${hexToRgba(targetColor, 0.15)}, 0 10px 40px -10px rgba(0, 0, 0, 0.6)`;
        
        // Custom hue background variants in dark mode
        if (activeColor === '#fc77b2') { // Pink Hue
          bgMainVal = '#0f0a0d';
          bgSecondaryVal = '#181216';
        } else if (activeColor === '#00bef2') { // Blue Hue
          bgMainVal = '#080c12';
          bgSecondaryVal = '#10151f';
        } else if (activeColor === '#fff461') { // Yellow/Orange Hue
          bgMainVal = '#0c0b08';
          bgSecondaryVal = '#161410';
        } else if (activeColor === '#36ae68') { // Green Hue
          bgMainVal = '#080c0a';
          bgSecondaryVal = '#101613';
        }
      }

      root.style.setProperty('--bg-main', bgMainVal);
      root.style.setProperty('--bg-secondary', bgSecondaryVal);
      root.style.setProperty('--card-border-color', cardBorderVal);
      root.style.setProperty('--glass', glassVal);
      root.style.setProperty('--glass-border', glassBorderVal);
      root.style.setProperty('--card-shadow', cardShadowVal);
      root.style.setProperty('--simulado-pro-color', simuladoProColorVal);
      root.style.setProperty('--menu-bg', menuBgVal);
      root.style.setProperty('--glass-tint', hexToRgba(targetColor, 0.03));
      root.style.setProperty('--box-bg-gradient', `linear-gradient(145deg, rgba(22, 22, 26, 0.98), ${hexToRgba(targetColor, 0.02)})`);
      root.style.setProperty('--btn-text-color', activeColor === '#fff461' ? '#1c1917' : '#ffffff');

    } else {
      const themeColors: Record<string, string> = {
        '#fc77b2': '#db2777',
        '#00bef2': '#0284c7',
        '#fff461': '#ca8a04',
        '#36ae68': '#15803d',
        'default': '#2563eb', 
      };

      targetColor = themeColors[activeColor] || themeColors['default'];
      accent2Color = activeColor === 'default' ? '#3b82f6' : activeColor;
      
      root.style.setProperty('--accent-1', targetColor);
      root.style.setProperty('--accent-2', accent2Color);
      root.style.setProperty('--accent-rgb', hexToRgb(targetColor));
      
      root.style.setProperty('--accent-1-05', hexToRgba(targetColor, 0.05));
      root.style.setProperty('--accent-1-08', hexToRgba(targetColor, 0.08));
      root.style.setProperty('--accent-1-10', hexToRgba(targetColor, 0.10));
      root.style.setProperty('--accent-1-15', hexToRgba(targetColor, 0.15));
      root.style.setProperty('--accent-1-20', hexToRgba(targetColor, 0.20));
      root.style.setProperty('--accent-1-30', hexToRgba(targetColor, 0.30));
      root.style.setProperty('--accent-1-40', hexToRgba(targetColor, 0.40));

      let bgMainVal = '#ffffff';
      let bgSecondaryVal = '#f8fafc';
      let cardBorderVal = 'rgba(0, 0, 0, 0.04)';
      let glassVal = 'rgba(255, 255, 255, 0.94)';
      let glassBorderVal = 'rgba(0, 0, 0, 0.03)';
      let cardShadowVal = '0 10px 40px -10px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02)';
      let simuladoProColorVal = '#3b82f6';
      let menuBgVal = 'rgba(255, 255, 255, 0.85)';

      if (activeColor === '#fc77b2') { // Pink
        bgMainVal = '#ffffff'; 
        bgSecondaryVal = '#fff5f9'; 
        cardBorderVal = 'rgba(252, 119, 178, 0.12)';
        glassVal = 'rgba(255, 255, 255, 0.96)';
        glassBorderVal = 'rgba(252, 119, 178, 0.08)';
        cardShadowVal = '0 15px 45px -15px rgba(252, 119, 178, 0.12)';
        simuladoProColorVal = '#db2777';
        menuBgVal = 'rgba(255, 251, 253, 0.9)';
      } else if (activeColor === '#00bef2' || activeColor === 'default') { // Blue
        const isDefault = activeColor === 'default';
        bgMainVal = '#ffffff';
        bgSecondaryVal = isDefault ? '#f1f7ff' : '#f0f9ff';
        cardBorderVal = isDefault ? 'rgba(59, 130, 246, 0.08)' : 'rgba(0, 190, 242, 0.12)';
        glassVal = 'rgba(255, 255, 255, 0.96)';
        glassBorderVal = isDefault ? 'rgba(59, 130, 246, 0.06)' : 'rgba(0, 190, 242, 0.08)';
        cardShadowVal = isDefault ? '0 15px 50px -15px rgba(59, 130, 246, 0.1)' : '0 15px 50px -15px rgba(0, 190, 242, 0.12)';
        simuladoProColorVal = isDefault ? '#2563eb' : '#0284c7';
        menuBgVal = isDefault ? 'rgba(240, 247, 255, 0.88)' : 'rgba(244, 250, 251, 0.88)';
      } else if (activeColor === '#fff461') { // Yellow
        bgMainVal = '#ffffff'; 
        bgSecondaryVal = '#fffdf0'; 
        cardBorderVal = 'rgba(202, 138, 4, 0.1)';
        glassVal = 'rgba(255, 255, 255, 0.96)';
        glassBorderVal = 'rgba(202, 138, 4, 0.06)';
        cardShadowVal = '0 15px 45px -15px rgba(202, 138, 4, 0.08)';
        simuladoProColorVal = '#ca8a04';
        menuBgVal = 'rgba(255, 253, 247, 0.9)';
      } else if (activeColor === '#36ae68') { // Green
        bgMainVal = '#ffffff'; 
        bgSecondaryVal = '#f5fdf9'; 
        cardBorderVal = 'rgba(54, 174, 104, 0.12)';
        glassVal = 'rgba(255, 255, 255, 0.96)';
        glassBorderVal = 'rgba(54, 174, 104, 0.08)';
        cardShadowVal = '0 15px 45px -15px rgba(54, 174, 104, 0.1)';
        simuladoProColorVal = '#15803d';
        menuBgVal = 'rgba(245, 253, 249, 0.9)';
      }

      root.style.setProperty('--bg-main', bgMainVal);
      root.style.setProperty('--bg-secondary', bgSecondaryVal);
      root.style.setProperty('--card-border-color', cardBorderVal);
      root.style.setProperty('--glass', glassVal);
      root.style.setProperty('--glass-border', glassBorderVal);
      root.style.setProperty('--card-shadow', cardShadowVal);
      root.style.setProperty('--simulado-pro-color', simuladoProColorVal);
      root.style.setProperty('--menu-bg', menuBgVal);
      
      if (activeColor && themeColors[activeColor]) {
        root.style.setProperty('--glass-tint', hexToRgba(targetColor, 0.02));
        root.style.setProperty('--box-bg-gradient', `linear-gradient(145deg, rgba(255, 255, 255, 0.98), ${hexToRgba(targetColor, 0.04)})`);
      } else {
        root.style.setProperty('--glass-tint', 'transparent');
        root.style.setProperty('--box-bg-gradient', 'linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(238, 242, 255, 0.7))');
      }
      root.style.setProperty('--btn-text-color', activeColor === '#fff461' ? '#1c1917' : '#ffffff');
    }
  };

  useLayoutEffect(() => {
    const savedTheme = safeLocalStorage.getItem('theme') || 'dark';
    const savedColorBlind = safeLocalStorage.getItem('colorblind');

    const applyTheme = (theme: string) => {
      const isDark = theme === 'dark';
      setIsDarkMode(isDark);
      
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark-mode', 'dark');
        root.classList.remove('light-mode');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light-mode');
        root.classList.remove('dark', 'dark-mode');
        root.style.colorScheme = 'light';
      }
      updateColorVariables(isDark);
      updateColorVariables(isDark);

      safeLocalStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    applyTheme(savedTheme);

    if (savedColorBlind) {
      setColorBlindMode(savedColorBlind as any);
    }

    const savedFontSize = safeLocalStorage.getItem('fontsize') || 'normal';
    setFontSize(savedFontSize as any);
    document.documentElement.classList.add(`fs-${savedFontSize}`);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data());
      }
    }, (error) => {
      console.error("Erro ao carregar perfil em tempo real no Layout:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Trigger auto-migration check for users affected by the custom database transition
    checkAndMigrateUser(user.uid);

    // Seeding mascot user if not exists
    const seedMascotUser = async () => {
      try {
        const mascotUID = "vestapp_official_mascot";
        const docRef = doc(db, 'users', mascotUID);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          await setDoc(docRef, {
            displayName: "VestApp Oficial",
            handle: "vestapp",
            bio: "Olá, vestibulando! Eu sou o mascote oficial do VestApp 🎓 Estarei sempre por aqui postando novidades, dicas de estudo, simulados e te ajudando a organizar sua rotina de aprovado. Vamos juntos conquistar essa vaga!",
            photoURL: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=vestapp&backgroundColor=ffadad,ffd6a5,fdffb6,caffbf,9bf6ff,a0c4ff,bdb2ff,ffc6ff,fffffc",
            coverURL: "https://images.unsplash.com/photo-1518164147695-078399310d60?q=80&w=2400&auto=format&fit=crop",
            level: 99,
            xp: 4999,
            followersCount: 0,
            followingCount: 0,
            studentType: "Mascote Oficial",
            studyGoal: "Medicina, Engenharia & Tudo",
            studyTime: "24/7 On-line",
            isVerified: true,
            createdAt: serverTimestamp()
          });
        }
        
        // Mascot posts are now kept persistent so that they don't disappear on reload/refresh
        console.log("Mascot posts are maintained persistently.");
      } catch (e) {
        console.error("Erro ao semear mascote:", e);
      }
    };
    seedMascotUser();

    // Set online status immediately on mount/auth load
    updatePresence('online');

    // Update 'lastSeen' in a 120 second heartbeat loop securely
    const presenceHeartbeat = setInterval(() => {
      updatePresence('online');
    }, 120000);

    const handleBeforeUnload = () => {
      updatePresence('offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(presenceHeartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // Dynamic study streak (onda de estudos) manager effect based on played/active days
  useEffect(() => {
    if (!user) return;

    const trackDailyActiveDay = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const playedDates: string[] = userData.playedDates || [];
        const savedStreak: number = userData.streak || 0;

        // Current local date format YYYY-MM-DD
        const getLocalDateStr = (d: Date = new Date()) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        const todayStr = getLocalDateStr(new Date());

        // Calculate consecutive streak days correctly
        const calcStreak = (dates: string[]): number => {
          if (!dates || dates.length === 0) return 0;
          const uniqueDates = Array.from(new Set(dates))
            .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
            .sort((a, b) => b.localeCompare(a));
          
          if (uniqueDates.length === 0) return 0;

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getLocalDateStr(yesterday);

          if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
            return 0;
          }

          let currentStreak = 0;
          let targetDate = uniqueDates.includes(todayStr) ? new Date() : yesterday;

          for (let i = 0; i < 365; i++) { // Max limit to avoid loop issues
            const checkStr = getLocalDateStr(targetDate);
            if (uniqueDates.includes(checkStr)) {
              currentStreak++;
              targetDate.setDate(targetDate.getDate() - 1);
            } else {
              break;
            }
          }

          return currentStreak;
        };

        const hasToday = playedDates.includes(todayStr);
        let updatedDates = [...playedDates];
        if (!hasToday) {
          updatedDates.push(todayStr);
        }

        const calculatedStreak = calcStreak(updatedDates);

        // Update if the streak changed, or today wasn't logged yet
        if (!hasToday || calculatedStreak !== savedStreak) {
          await updateDoc(userRef, {
            playedDates: updatedDates,
            streak: calculatedStreak
          });

          if (!hasToday) {
            if (calculatedStreak > 1) {
              toast.success(`Estudo diário registrado! Sua onda de estudos é de ${calculatedStreak} dias seguidos! 🔥`);
            } else {
              toast.success(`Iniciou uma nova onda de estudos! Mantenha o foco! 🚀🔥`);
            }
          }
        }
      } catch (err) {
        console.error("Erro ao atualizar sequência diária:", err);
      }
    };

    trackDailyActiveDay();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatNotificationTime(doc.data().createdAt)
      }));
      setNotifications(notifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleOpenProfile = async (e: any) => {
      if (e.detail?.uid) {
        if (user && e.detail.uid === user.uid) {
          navigate('/perfil');
        } else {
          setViewingProfileUid(e.detail.uid);
        }
      } else if (e.detail?.handle) {
        try {
          const handle = e.detail.handle;
          const handlesToTry = [handle, handle.toLowerCase()];
          // Remove duplicates if handle was already lowercase
          const uniqueHandles = [...new Set(handlesToTry)];
          
          let foundUid: string | null = null;
          
          for (const h of uniqueHandles) {
            const q = query(collection(db, 'users'), where('handle', '==', h));
            const snap = await getDocs(q);
            if (!snap.empty) {
              foundUid = snap.docs[0].id;
              break;
            }
          }

          if (foundUid) {
            if (user && foundUid === user.uid) {
              navigate('/perfil');
            } else {
              setViewingProfileUid(foundUid);
            }
          } else {
            toast.error(`Estudante @${handle} não encontrado.`);
          }
        } catch (err) {
          console.error("Erro ao buscar perfil por handle:", err);
        }
      }
    };
    window.addEventListener('open-profile', handleOpenProfile as EventListener);
    return () => window.removeEventListener('open-profile', handleOpenProfile as EventListener);
  }, [user, navigate]);

  const formatNotificationTime = (timestamp: any) => {
    if (!timestamp) return 'Agora';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString();
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      try {
        const batch = writeBatch(db);
        unread.forEach(n => {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        });
        await batch.commit();
        toast.success("Todas as notificações foram marcadas como lidas! 🔔");
      } catch (err) {
        console.error("Erro ao marcar todas como lidas:", err);
      }
    } else {
      toast.info("Você não possui notificações não lidas.");
    }
  };

  const handleBellClick = async () => {
    const nextShow = !showNotifications;
    setShowNotifications(nextShow);
    if (nextShow && user) {
      const unread = notifications.filter(n => !n.read);
      if (unread.length > 0) {
        try {
          const batch = writeBatch(db);
          unread.forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
          });
          await batch.commit();
        } catch (err) {
          console.error("Erro ao marcar notificações como lidas ao abrir o sino:", err);
        }
      }
    }
  };

  const handleLogout = async () => {
    await updatePresence('offline');
    await signOut(auth);
    navigate('/');
  };

  useEffect(() => {
    const handleThemeChange = () => {
      const savedTheme = safeLocalStorage.getItem('theme') || 'dark';
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
      
      // Clear old theme classes
      document.documentElement.classList.remove('light-mode', 'dark-mode', 'dark', 'oled-mode');
      
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode', 'dark');
      } else {
        document.documentElement.classList.add('light-mode');
      }
      
      updateColorVariables(isDark, savedTheme);
    };

    const handleThemeColorChange = () => {
      const savedTheme = safeLocalStorage.getItem('theme') || 'dark';
      const isDark = savedTheme === 'dark';
      updateColorVariables(isDark, savedTheme);
    };

    const handleColorBlindChange = () => {
      const savedColorBlind = safeLocalStorage.getItem('colorblind') || 'none';
      setColorBlindMode(savedColorBlind as any);
    };

    const handleFontSizeChange = () => {
      const savedFontSize = safeLocalStorage.getItem('fontsize') || 'normal';
      setFontSize(savedFontSize as any);
      
      // Remove old fs classes
      document.documentElement.classList.remove('fs-small', 'fs-normal', 'fs-large', 'fs-extra-large');
      document.documentElement.classList.add(`fs-${savedFontSize}`);
    };

    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('theme-color-changed', handleThemeColorChange);
    window.addEventListener('colorblind-changed', handleColorBlindChange);
    window.addEventListener('fontsize-changed', handleFontSizeChange);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('theme-color-changed', handleThemeColorChange);
      window.removeEventListener('colorblind-changed', handleColorBlindChange);
      window.removeEventListener('fontsize-changed', handleFontSizeChange);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`viewport notranslate ${isDarkMode ? 'dark-mode dark' : 'light-mode'} ${colorBlindMode !== 'none' ? `cb-${colorBlindMode}` : ''}`} translate="no">
      <InteractiveBackground />
      <div className="glass-bg"></div>

      {colorBlindMode !== 'none' && (
        <div className="cb-active-indicator">
          <Eye size={14} />
          <span>MODO {colorBlindMode.toUpperCase()} ATIVO</span>
        </div>
      )}

      <header className="top-nav px-1 sm:px-4 md:px-8 py-2 md:py-6 bg-transparent backdrop-blur-none border-none" style={{ zIndex: 2100 }}>
        <div className="nav-container max-w-[1800px] mx-auto bg-white/75 dark:bg-[#0c0c0e]/85 backdrop-blur-3xl border border-slate-200/40 dark:border-[var(--accent-1-20,rgba(var(--accent-rgb),0.2))] rounded-[1.25rem] md:rounded-[2rem] px-2 sm:px-6 md:px-8 h-[54px] sm:h-[68px] md:h-[84px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500">
          <Link to="/feed" className="brand group transition-all flex items-center gap-1.5 sm:gap-3">
            <div className="logo-icon-pure group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 drop-shadow-md !w-8 !h-8 sm:!w-10 sm:!h-10">
              <img src="/Vestapp/img/vest.png" alt="Mascote" className="logo-mascot w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]" referrerPolicy="no-referrer" />
            </div>
            <span className="logo-text text-base sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">Vest<span className="text-accent-1 drop-shadow-[0_2px_10px_rgba(var(--accent-rgb),0.5)]" style={{ color: 'var(--accent-1)' }}>App</span></span>
          </Link>
          
           <nav className="main-menu hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2">
            {[
              { to: '/feed', icon: Home, label: 'Feed' },
              { to: '/simulado', icon: FileSignature, label: 'Simulado' },
              { to: '/redacao', icon: FileText, label: 'Redação' },
              { to: '/desafios', icon: Gamepad, label: 'Gamificação' },
              { to: '/perfil', icon: User, label: 'Perfil' },
            ].map((item: any) => (
              <Link 
                key={item.to}
                to={item.to} 
                className={`nav-link relative font-black flex items-center gap-1.5 lg:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 lg:px-4 lg:py-2.5 xl:px-6 xl:py-3 rounded-full transition-all duration-300 group overflow-hidden ${
                  isActive(item.to) 
                    ? 'text-[var(--accent-1)] shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)] active' 
                    : 'text-slate-800 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isActive(item.to) && (
                  <span className="absolute inset-0 bg-[var(--accent-1-10)] backdrop-blur-md rounded-full border border-[var(--accent-1-30)] -z-10 shadow-[0_2px_15px_rgba(var(--accent-rgb),0.15)]"></span>
                )}
                {!isActive(item.to) && (
                  <span className="absolute inset-0 bg-slate-100/0 dark:bg-white/0 group-hover:bg-slate-100/80 dark:group-hover:bg-white/5 rounded-full transition-colors duration-300 -z-10"></span>
                )}
                <item.icon className={`transition-all duration-300 size-4 lg:size-[18px] ${isActive(item.to) ? 'scale-110 drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]' : 'group-hover:scale-110'}`} style={{ color: 'var(--accent-1)' }} /> 
                <span className="transition-colors duration-300 text-[11px] lg:text-xs xl:text-[13px] tracking-wide font-extrabold uppercase hidden lg:inline">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="relative">
              <button 
                onClick={handleBellClick}
                className={`w-9 h-9 sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-[1.25rem] transition-all duration-300 flex items-center justify-center border hover:scale-105 active:scale-95 cursor-pointer ${
                  showNotifications 
                  ? 'bg-accent-1/15 border-accent-1/50 text-accent-1 shadow-[0_4px_16px_rgba(var(--accent-rgb),0.25)]' 
                  : 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 shadow-sm'
                }`}
                title="Notificações"
              >
                <Bell className={`w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] ${showNotifications ? 'animate-pulse drop-shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]' : ''}`} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-rose-500 rounded-full border border-white dark:border-[#0a0a0c] shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-full right-[-50px] sm:right-0 mt-4 w-[calc(100vw-32px)] sm:w-[380px] bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] sm:rounded-[1.75rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">Notificações</h3>
                        <button 
                          onClick={markAllAsRead}
                          className="text-[9px] sm:text-[10px] text-accent-1 hover:text-accent-2 transition-colors cursor-pointer font-black uppercase tracking-widest bg-accent-1/10 hover:bg-accent-1/20 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full"
                        >
                          Marcar lidas
                        </button>
                    </div>
                    <div className="max-h-[300px] sm:max-h-[380px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div 
                                  key={n.id} 
                                  className={`p-3.5 sm:p-4 border-b border-slate-50 dark:border-white/[0.02] hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all cursor-pointer flex gap-3 group ${!n.read ? 'bg-accent-1/5' : ''}`}
                                  onClick={async () => {
                                    if (!n.read) {
                                      try {
                                        await updateDoc(doc(db, 'notifications', n.id), { read: true });
                                      } catch (err) {
                                        console.error("Erro ao marcar notificação individual como lida:", err);
                                      }
                                    }
                                    if (n.postId) {
                                      navigate(`/feed?post=${n.postId}`);
                                    } else if (n.type === 'follow') {
                                      window.dispatchEvent(new CustomEvent('open-profile', { detail: { uid: n.senderId } }));
                                    }
                                    setShowNotifications(false);
                                  }}
                                >
                                    <div className="relative shrink-0">
                                      <UserAvatar 
                                        uid={n.senderId}
                                        fallbackPhoto={n.senderPhoto || ""}
                                        fallbackName={n.senderName || "Estudante"}
                                        size="36px"
                                        className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border border-white dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform"
                                      />
                                      {!n.read && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-1 rounded-full border border-white dark:border-[#0a0a0c] shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
                                            <span className="font-bold text-[12px] sm:text-[13px] text-slate-900 dark:text-white truncate tracking-tight">{n.senderName}</span>
                                            <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">{n.time}</span>
                                        </div>
                                        <p className="text-[11px] sm:text-[12px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px]">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
                                  <Bell size={24} className="opacity-40 text-slate-500 dark:text-slate-400" />
                                </div>
                                <p className="text-xs sm:text-sm text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Silêncio no ninho</p>
                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Você não tem novas notificações.</p>
                            </div>
                        )}
                    </div>
                  <Link 
                    to="/configuracoes" 
                    onClick={() => setShowNotifications(false)}
                    className="p-3.5 sm:p-4 flex items-center justify-center gap-2 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors bg-white dark:bg-transparent border-t border-slate-101 dark:border-white/5"
                  >
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Configurações de Alerta</span>
                  </Link>
                </div>
              )}
            </div>

            <Link 
              to="/configuracoes" 
              className="hidden md:flex w-9 h-9 sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-[1.25rem] bg-white/60 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/50 hover:border-slate-300/80 dark:border-white/10 dark:hover:border-white/20 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white shadow-sm hover:shadow-md transition-all duration-300 items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
              title="Configurações"
            >
              <SettingsIcon className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] transition-transform duration-500 hover:rotate-90" />
            </Link>

            <button 
              onClick={handleLogout} 
              className="hidden md:flex w-9 h-9 sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-[1.25rem] bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 shadow-sm hover:shadow-md hover:shadow-rose-500/10 transition-all duration-300 items-center justify-center ml-1 cursor-pointer hover:scale-105 active:scale-95"
              title="Sair"
            >
              <LogOut className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-[1.25rem] bg-white/60 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300/80 dark:hover:border-white/20 shadow-sm transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Menu principal"
            >
              {isMobileMenuOpen ? <X className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" /> : <Menu className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1999] md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-[68px] sm:top-[84px] left-3 right-3 sm:left-4 sm:right-4 md:hidden bg-white/95 dark:bg-[#0a0a0c]/95 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] p-4 sm:p-5 z-[2000] flex flex-col gap-3"
            >
              {/* User Greeting Block */}
              {user && (
                <div className="flex items-center gap-3 p-2 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl">
                  <UserAvatar 
                    uid={user.uid} 
                    fallbackPhoto={userProfile?.photoURL || user.photoURL || ""} 
                    fallbackName={userProfile?.displayName || user.displayName || "Usuário"} 
                    size={40} 
                    className="border border-slate-200 dark:border-white/10 object-cover rounded-full" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest leading-none">Minha Conta</p>
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate mt-1 leading-tight">{userProfile?.displayName || user.displayName || 'Estudante'}</p>
                  </div>
                </div>
              )}

              {/* Navigation links stack */}
              <div className="flex flex-col gap-1.5">
                {[
                  { to: '/feed', icon: Home, label: 'Feed' },
                  { to: '/desafios', icon: Gamepad, label: 'Gamificação' },
                  { to: '/simulado', icon: FileSignature, label: 'Simulado' },
                  { to: '/redacao', icon: FileText, label: 'Redação' },
                  { to: '/perfil', icon: User, label: 'Perfil' },
                ].map((item: any) => {
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 font-extrabold ${
                        active 
                          ? 'bg-accent-1/10 text-[var(--accent-1)] border border-[var(--accent-1-20)] shadow-[0_2px_12px_rgba(var(--accent-rgb),0.05)]' 
                          : 'text-slate-800 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" style={{ color: active ? 'var(--accent-1)' : '#71717a' }} />
                        <span className="text-xs uppercase tracking-widest">{item.label}</span>
                      </div>
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-1)] animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Settings / Logout action row */}
              <div className="pt-3 mt-1 border-t border-slate-101 dark:border-white/5 grid grid-cols-2 gap-2.5">
                <Link
                  to="/configuracoes"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-[10px] font-black uppercase tracking-widest border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-zinc-300 transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Ajustes
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className={`w-full max-w-full overflow-x-hidden min-h-screen pb-12 ${location.pathname === '/perfil' ? '' : 'pt-24 md:pt-32'}`}>
        {children}
      </main>

      <AnimatePresence>
        {viewingProfileUid && (
          <ProfileOverlay 
            uid={viewingProfileUid} 
            onClose={() => setViewingProfileUid(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
