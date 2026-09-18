import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { sfx } from './core/sound';
import Home from './pages/Home';
import Play from './pages/Play';
import Daily from './pages/Daily';
import Education from './pages/Education';
import EducationHome from './pages/EducationHome';
import NotFound from './pages/NotFound';
import SectionPlaceholder from './pages/SectionPlaceholder';

const AboveTheSurface = lazy(() => import('./pages/AboveTheSurface'));

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
      <Route path="/education" element={<EducationHome />} />
      <Route path="/education/below-the-surface" element={<Education />} />
      <Route path="/education/above-the-surface" element={<Suspense fallback={null}><AboveTheSurface /></Suspense>} />
      <Route path="/weird" element={<SectionPlaceholder section="weird" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
