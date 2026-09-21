import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { sfx } from './core/sound';
import Home from './pages/Home';
import Play from './pages/Play';
import Daily from './pages/Daily';
import Education from './pages/Education';
import EducationHome from './pages/EducationHome';
import NotFound from './pages/NotFound';
import Weird from './pages/Weird';
import { APP_ROUTES } from './seo/pages';

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
      <Route path={APP_ROUTES.home} element={<Home />} />
      <Route path={APP_ROUTES.play} element={<Play />} />
      <Route path={APP_ROUTES.daily} element={<Daily />} />
      <Route path={APP_ROUTES.education} element={<EducationHome />} />
      <Route path={APP_ROUTES.belowTheSurface} element={<Education />} />
      <Route path={APP_ROUTES.aboveTheSurface} element={<Suspense fallback={null}><AboveTheSurface /></Suspense>} />
      <Route path={APP_ROUTES.weird} element={<Weird />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
