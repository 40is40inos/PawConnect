// Shared frame for the login and sign-up pages: a photo panel and a form
// panel side by side in golden-ratio proportions.
import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { EASE_OUT, goldenSpiralPath, usePointerParallax } from '../../motion/kit';
import './auth.css';

const SPIRAL = goldenSpiralPath(61.8, 38.2, 60, 3);

// The photo takes the larger (1.618) share by default; `wideForm` gives it
// to the form instead, for the longer sign-up form.
export function AuthLayout({ photo, photoPosition, caption, chips = [], wideForm = false, children }) {
  const ref = useRef(null);
  const { px, py } = usePointerParallax(ref);
  const photoX = useTransform(px, (v) => v * -13);
  const photoY = useTransform(py, (v) => v * -13);
  const chipX = useTransform(px, (v) => v * 21);
  const chipY = useTransform(py, (v) => v * 21);

  return (
    <div className={`authPage ${wideForm ? 'isWide' : ''}`} ref={ref}>
      <motion.aside
        className="authPhoto"
        style={photoPosition ? { '--photo-pos': photoPosition } : undefined}
        initial={{ clipPath: 'inset(0% 100% 0% 0% round 34px)' }}
        animate={{ clipPath: 'inset(0% 0% 0% 0% round 34px)' }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
      >
        <motion.img
          src={photo}
          alt=""
          style={{ x: photoX, y: photoY }}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1.12 }}
          transition={{ duration: 1.6, ease: EASE_OUT }}
        />
        <svg className="authSpiral" viewBox="0 0 100 100" aria-hidden="true">
          <motion.path
            d={SPIRAL}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.6, ease: EASE_OUT, delay: 0.6 }}
          />
        </svg>

        <motion.div className="authChips" style={{ x: chipX, y: chipY }}>
          {chips.map((chip, i) => (
            <motion.span
              key={chip}
              className="authChip"
              initial={{ opacity: 0, y: 21, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.7 + i * 0.12 }}
            >
              {chip}
            </motion.span>
          ))}
        </motion.div>

        {caption && (
          <motion.p
            className="authCaption"
            initial={{ opacity: 0, y: 21 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.5 }}
          >
            {caption}
          </motion.p>
        )}
      </motion.aside>

      <motion.section
        className="authPanel"
        initial={{ opacity: 0, x: 34 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 }}
      >
        {children}
      </motion.section>
    </div>
  );
}
