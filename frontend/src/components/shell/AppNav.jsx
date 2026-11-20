// The floating top bar on every screen except the landing page (which has its
// own). It stays mounted across route changes, so the active-link highlight
// slides from one link to the next.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { EASE_OUT } from '../../motion/kit';
import { Logo } from '../../pages/landing/LandingNav';
import { useSession } from '../../session';
import { hueFor, initials } from '../../utils/avatar';

const isKeeperPath = (p) => p === '/guest' || p.startsWith('/keepers/');

function linksFor(me) {
  if (!me) return [{ to: '/guest', label: 'Find a keeper', match: isKeeperPath }];
  if (me.role === 'ADMIN') return [{ to: '/admin', label: 'Admin', match: (p) => p === '/admin' }];
  return [
    { to: '/', label: 'Dashboard', match: (p) => p === '/' },
    { to: '/guest', label: 'Keepers', match: isKeeperPath },
  ];
}

const ROLE_LABEL = { PETKEEPER: 'Pet keeper', PETOWNER: 'Pet owner' };

export function AppNav() {
  const { me, signOut } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Tighten into a frosted bar once the page scrolls.
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 13));

  const onLogout = () => signOut(() => navigate('/login'));

  return (
    <motion.header
      className={`appNav ${scrolled ? 'isScrolled' : ''}`}
      initial={{ y: -34, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <div className="appNavInner">
        <Link to="/" className="appNavHome" aria-label="PawConnect home">
          <Logo />
        </Link>

        <nav className="appNavLinks" aria-label="Main">
          {linksFor(me).map(({ to, label, match }) => {
            const active = match(pathname);
            return (
              <Link key={to} to={to} className="appNavLink" aria-current={active ? 'page' : undefined}>
                {active && (
                  <motion.span
                    layoutId="appNavActive"
                    className="appNavActive"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="appNavActions">
          {me === null && (
            <>
              <Link className="pill pillGhost pillSmall" to="/login">
                Log in
              </Link>
              <Link className="pill pillPrimary pillSmall" to="/register">
                Sign up
              </Link>
            </>
          )}
          {me && (
            <>
              <span className="appNavUser">
                <span className="appNavAvatar" style={{ '--hue': hueFor(me.userName) }} aria-hidden="true">
                  {initials(me)}
                </span>
                <span className="appNavUserText">
                  <strong>{me.firstName}</strong>
                  <small>{me.role === 'ADMIN' ? 'Admin' : ROLE_LABEL[me.type]}</small>
                </span>
              </span>
              <button type="button" className="pill pillGhost pillSmall" onClick={onLogout}>
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
