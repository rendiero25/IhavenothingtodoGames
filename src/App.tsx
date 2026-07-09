import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Play from './pages/Play';
import Daily from './pages/Daily';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play/:gameId" element={<Play />} />
      <Route path="/daily" element={<Daily />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
