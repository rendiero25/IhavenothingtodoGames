import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { sfx } from './core/sound';
import Home from './pages/Home';
import Play from './pages/Play';
import Daily from './pages/Daily';
import NotFound from './pages/NotFound';

export default function App() {
  useEffect(() => {
    const unlock = () => sfx.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:gameId" element={<Play />} />
      <Route path="/daily" element={<Daily />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
