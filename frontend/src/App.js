import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'motion/react';
import './App.css';
import './components/shell/shell.css';
import { SessionProvider, useSession } from './session';
import { AppNav } from './components/shell/AppNav';
import { AppBackdrop } from './components/shell/AppBackdrop';
import { PageTransition } from './components/shell/PageTransition';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { MainPage } from './pages/mainPage/mainPage';
import { Guest } from './pages/guest/guest';
import Admin from './pages/admin/admin';
import { KeeperPage } from './pages/keeper/keeperPage';

function Shell() {
  const location = useLocation();
  const { me } = useSession();
  // Visitors at "/" get the landing page, which brings its own nav and background.
  const bare = location.pathname === '/' && !me;

  return (
    <div className={bare ? 'App App--bare' : 'App'}>
      {!bare && <AppBackdrop />}
      {!bare && <AppNav />}
      <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<MainPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/guest" element={<Guest />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/keepers/:userName" element={<KeeperPage />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <Router>
      <SessionProvider>
        <MotionConfig reducedMotion="user">
          <Shell />
        </MotionConfig>
      </SessionProvider>
    </Router>
  );
}

export default App;
