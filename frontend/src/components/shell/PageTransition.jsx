// Route-change transition: the old screen lifts away quickly, the new one
// settles in a little slower. Used inside <AnimatePresence mode="wait">.
import { motion } from 'motion/react';
import { EASE_OUT } from '../../motion/kit';

const variants = {
  initial: { opacity: 0, y: 13 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' } },
};

export function PageTransition({ children }) {
  return (
    <motion.div className="pageFrame" variants={variants} initial="initial" animate="enter" exit="exit">
      {children}
    </motion.div>
  );
}
