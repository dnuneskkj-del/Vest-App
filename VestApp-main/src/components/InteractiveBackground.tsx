import React, { useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';
import { safeLocalStorage } from '../lib/storage';

const InteractiveBackground: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = safeLocalStorage.getItem('theme');
    return savedTheme !== 'light';
  });

  // Smooth the mouse movement
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = safeLocalStorage.getItem('theme');
      setIsDark(savedTheme !== 'light');
    };

    checkTheme();
    window.addEventListener('theme-changed', checkTheme);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('theme-changed', checkTheme);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className={`fixed inset-0 -z-20 overflow-hidden pointer-events-none ${isDark ? 'bg-[#050505]' : 'bg-[var(--bg-main)]'}`}>
      {/* Background Grid */}
      <div className={`absolute inset-0 ${isDark ? 'opacity-[0.1]' : 'opacity-[0.03]'}`} style={{ 
        backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
        backgroundSize: '100px 100px'
      }} />

      {/* Dynamic Gradient Blobs */}
      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className={`absolute w-[900px] h-[900px] rounded-full ${isDark ? 'bg-accent-1 opacity-[0.12]' : 'bg-accent-1 opacity-[0.08]'} blur-[140px] pointer-events-none`}
      />
      
      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
          translateX: '-10%',
          translateY: '-70%',
        }}
        className={`absolute w-[600px] h-[600px] rounded-full ${isDark ? 'bg-accent-2 opacity-[0.08]' : 'bg-blue-400 opacity-[0.06]'} blur-[120px] pointer-events-none`}
      />

      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
          translateX: '-80%',
          translateY: '-20%',
        }}
        className={`absolute w-[500px] h-[500px] rounded-full ${isDark ? 'bg-emerald-500 opacity-[0.1]' : 'bg-emerald-300 opacity-[0.05]'} blur-[100px] pointer-events-none`}
      />

      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
          translateX: '-30%',
          translateY: '-30%',
        }}
        className={`absolute w-[400px] h-[400px] rounded-full ${isDark ? 'bg-accent-2 opacity-[0.07]' : 'bg-blue-300 opacity-[0.04]'} blur-[100px] pointer-events-none`}
      />

      {/* Static Atmospheric Gradients */}
      <div className={`absolute top-[10%] left-[5%] w-[600px] h-[600px] ${isDark ? 'bg-emerald-500/10' : 'bg-blue-500/5'} rounded-full blur-[150px] animate-pulse pointer-events-none`} />
      <div className={`absolute bottom-[5%] right-[5%] w-[700px] h-[700px] ${isDark ? 'bg-accent-1/10' : 'bg-blue-500/5'} rounded-full blur-[200px] pointer-events-none`} />
      
      {/* Overlay Texture */}
      <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] ${isDark ? 'opacity-[0.12]' : 'opacity-[0.05]'} mix-blend-overlay pointer-events-none scale-150`} />
      
      {/* Vignette */}
      <div className={`absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,${isDark ? 'rgba(5,5,5,0.4)_60%,#050505_100%' : 'rgba(255,255,255,0)_60%,rgba(240,245,255,0.3)_100%'})]`} />
    </div>
  );
};

export default InteractiveBackground;
