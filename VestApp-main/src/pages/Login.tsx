import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, signInWithGoogle, onAuthStateChanged, loginWithEmail, resetPassword } from '../firebase';
import { Rocket, Mail, Lock, Chrome, Info } from 'lucide-react';
import { toast } from 'sonner';
import Countdown from '../components/Countdown';
import InteractiveBackground from '../components/InteractiveBackground';
import { safeLocalStorage } from '../lib/storage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        navigate('/feed');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setIsGmail(val.toLowerCase().endsWith('@gmail.com'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setEyeGlow(true);
    
    try {
      await loginWithEmail(email, password);
      setEyeGlow(false);
      navigate('/feed');
    } catch (error: any) {
      console.error("Erro no login:", error);
      let message = "Erro ao entrar. Verifique seus dados.";
      if (error.code === 'auth/user-not-found') message = "Usuário não encontrado.";
      if (error.code === 'auth/wrong-password') message = "Senha incorreta.";
      if (error.code === 'auth/invalid-email') message = "E-mail inválido.";
      if (error.code === 'auth/invalid-credential') message = "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
      if (error.code === 'auth/too-many-requests') message = "Muitas tentativas falhas. Sua conta foi temporariamente bloqueada por segurança. Tente novamente mais tarde ou recupere sua senha.";
      if (error.code === 'auth/operation-not-allowed') message = "O login com e-mail/senha não está ativado no Firebase Console.";
      
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
        navigate('/feed');
      } else {
        setLoading(false);
        setEyeGlow(false);
      }
    } catch (error: any) {
      console.error("Erro no login do Google:", error);
      toast.error(
        "Erro ao entrar com Google (provavelmente bloqueado pelo iframe). Para resolver, clique em 'Abrir em uma nova guia' no topo direito, ou use o formulário de E-mail e Senha abaixo.",
        { duration: 10000 }
      );
      setEyeGlow(false);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Por favor, digite seu e-mail para recuperar a senha.");
      return;
    }

    try {
      await resetPassword(email);
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      console.error("Erro ao resetar senha:", error);
      toast.error("Erro ao enviar e-mail de recuperação: " + error.message);
    }
  };

  return (
    <div className="login-page-container relative overflow-hidden">
      <InteractiveBackground />
      <div className={`login-container ${theme}-mode bg-white dark:bg-[#0a0a0c] lg:bg-gradient-to-br lg:from-blue-50 lg:to-white lg:dark:from-[#0a0a0c] lg:dark:to-[#000000] relative z-10`}>
        <div className="left-side">
          <div className="content-wrapper">
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
              <p>Onde o esforço vira aprovação. 🎓</p>
            </div>
          </div>
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
        </div>

        <div className="right-side">
          <div className="card animate-fade-in">
            <div className="header">
              <p>Entre na sua área de estudos</p>
              <Countdown title="Faltam para o ENEM" />
            </div>

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email" 
                  placeholder="E-mail de estudante" 
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
                  <span>Conta Gmail detectada. Você pode entrar com Google ou usar sua senha.</span>
                </div>
              )}

              <div className="input-group">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password" 
                  placeholder="Sua senha" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="forgot-password">
                <button type="button" onClick={handleForgotPassword} className="link-btn">
                  Esqueci minha senha
                </button>
              </div>

              <button 
                type="submit" 
                className="btn-main"
                disabled={loading}
              >
                Acessar Plataforma
                <Rocket size={20} />
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
                Entrar com Google
              </button>
            </form>

            <div className="footer-actions" style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>Ainda não faz parte do ninho?</p>
              <Link to="/cadastro" className="btn-secondary" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                background: 'var(--bg-main)',
                border: '1px dashed var(--glass-border)',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                marginBottom: '16px'
              }}>
                <Rocket size={18} style={{ transform: 'rotate(45deg)' }} />
                Criar minha conta agora
              </Link>
              
              <button 
                type="button"
                onClick={() => navigate('/sobre')}
                className="mt-6 mx-auto px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-full transition-all uppercase tracking-widest"
              >
                <Info size={14} />
                Sobre o VestApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
