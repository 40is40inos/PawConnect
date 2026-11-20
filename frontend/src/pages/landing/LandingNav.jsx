import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { EASE_OUT } from '../../motion/kit';
import { PawIcon } from './icons';

const LINKS = [
  ['#how', 'How it works'],
  ['#keepers', 'Keepers'],
  ['#reviews', 'Reviews'],
];

export function Logo() {
  return (
    <span className="logo">
      <span className="logoMark">
        <PawIcon />
      </span>
      <span className="logoWord">PawConnect</span>
    </span>
  );
}

// Fixed top bar: transparent over the hero, frosted glass once you scroll.
export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 21));

  return (
    <motion.header
      className={`lnav ${scrolled ? 'isScrolled' : ''}`}
      initial={{ y: -34, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
    >
      <div className="lnavInner">
        <Link to="/" aria-label="PawConnect home">
          <Logo />
        </Link>
        <nav className="lnavLinks" aria-label="Sections">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="lnavActions">
          <Link className="pill pillGhost pillSmall" to="/login">
            Log in
          </Link>
          <Link className="pill pillPrimary pillSmall" to="/register">
            Sign up
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
