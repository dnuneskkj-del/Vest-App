import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sobre from './pages/Sobre';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Redacao from './pages/Redacao';
import Challenges from './pages/Challenges';
import Trending from './pages/Trending';
import Simulado from './pages/Simulado';
import ComicExercises from './pages/ComicExercises';
import SimuladoNivel from './pages/SimuladoNivel';
import Schedule from './pages/Schedule';

function App() {
  useEffect(() => {
    // Force Portuguese / No Translation tags to prevent browsers (e.g. Chrome) from auto-translating Portuguese terms incorrectly
    document.documentElement.setAttribute('lang', 'pt-BR');
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.classList.add('notranslate');
    
    document.body.setAttribute('translate', 'no');
    document.body.classList.add('notranslate');
  }, []);

  return (
    <Router>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/desafios" element={<Challenges />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/redacao" element={<Redacao />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/simulado" element={<Simulado />} />
        <Route path="/comic-exercises/:area/:subtopic" element={<ComicExercises />} />
        <Route path="/simulados/:level" element={<SimuladoNivel />} />
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/cronograma" element={<Schedule />} />
      </Routes>
    </Router>
  );
}

export default App;
