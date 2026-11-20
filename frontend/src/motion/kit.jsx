// Shared motion building blocks. Everything here respects
// prefers-reduced-motion and keeps pointer effects to mouse/trackpad devices.
import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion/react';

export const EASE_OUT = [0.22, 1, 0.36, 1];
export const PHI = 1.618;

const FINE_POINTER = '(hover: hover) and (pointer: fine)';

// True on devices with a mouse or trackpad (no tilt/parallax on touch screens).
export function useFinePointer() {
  const [fine, setFine] = useState(() => typeof window !== 'undefined' && window.matchMedia(FINE_POINTER).matches);
  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER);
    const onChange = () => setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return fine;
}

// Inertial smooth scrolling while the calling page is mounted.
export function useSmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return undefined;
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -89 } });
    let frame = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduce]);
}

// Fades and lifts its children in the first time they scroll into view.
export function Reveal({ as = 'div', delay = 0, y = 34, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -13% 0px' }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// A heading whose words rise out of a mask one after another.
// `parts` is a list of { text, className? } so single words can be styled.
export function SplitWords({ as = 'h1', parts, className, delay = 0, stagger = 0.08 }) {
  const Tag = as;
  const label = parts.map((p) => p.text).join('');
  let index = 0;
  return (
    <Tag className={className} aria-label={label}>
      {parts.map((part, pi) =>
        part.text.split(/(\s+)/).map((word, wi) => {
          if (!word) return null;
          if (/^\s+$/.test(word)) return ' ';
          const i = index++;
          return (
            <span className="wordMask" key={`${pi}-${wi}`} aria-hidden="true">
              <motion.span
                className={`word ${part.className || ''}`}
                initial={{ y: '110%', rotate: 8 }}
                animate={{ y: '0%', rotate: 0 }}
                transition={{ duration: 1.1, ease: EASE_OUT, delay: delay + i * stagger }}
              >
                {word}
              </motion.span>
            </span>
          );
        })
      )}
    </Tag>
  );
}

// Counts from 0 to `to` when scrolled into view.
export function CountUp({ to, decimals = 0, duration = PHI, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const format = (v) => `${v.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    if (!inView || !ref.current) return undefined;
    if (reduce) {
      ref.current.textContent = format(to);
      return undefined;
    }
    const controls = animate(0, to, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, reduce]);

  return <span ref={ref}>{format(reduce ? to : 0)}</span>;
}

// An endless strip that drifts sideways, speeds up and leans with scroll velocity.
export function Marquee({ children, baseVelocity = -3, className = '' }) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(velocity, [-2000, 2000], [8, -8]);
  const x = useTransform(baseX, (v) => `${wrap(-50, -25, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = direction.current * baseVelocity * (delta / 1000);
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    move += direction.current * move * b;
    baseX.set(baseX.get() + move);
  });

  return (
    <div className={`marquee ${className}`}>
      <motion.div className="marqueeTrack" style={{ x, skewX: reduce ? 0 : skewX }}>
        {[0, 1, 2, 3].map((i) => (
          <span className="marqueeCopy" key={i} aria-hidden={i > 0 ? 'true' : undefined}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// A card that tilts towards the cursor in 3D, with a soft light glare.
export function Tilt({ children, className = '', max = 8, glare = true, style, ...rest }) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const active = fine && !reduce;
  const spring = { stiffness: 220, damping: 21 };
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgb(255 244 230 / 0.2), transparent 55%)`;

  const onPointerMove = (e) => {
    if (!active) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rotateY.set((px - 0.5) * 2 * max);
    rotateX.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      className={`tilt ${className}`}
      style={{ ...style, rotateX, rotateY, transformPerspective: 987 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...rest}
    >
      {children}
      {glare && active && <motion.span className="tiltGlare" style={{ background: glareBg }} aria-hidden="true" />}
    </motion.div>
  );
}

// Pointer position over `ref`'s element as smoothed motion values in [-1, 1].
export function usePointerParallax(ref) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const spring = { stiffness: 80, damping: 21, mass: 0.8 };
  const px = useSpring(0, spring);
  const py = useSpring(0, spring);

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduce) return undefined;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      px.set(((e.clientX - r.left) / r.width) * 2 - 1);
      py.set(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const onLeave = () => {
      px.set(0);
      py.set(0);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, fine, reduce, px, py]);

  return { px, py };
}

// A logarithmic golden spiral (grows by φ every quarter turn) as an SVG path,
// centred on (cx, cy) with outer radius `r`.
export function goldenSpiralPath(cx = 50, cy = 50, r = 48, turns = 2.75) {
  const b = Math.log(PHI) / (Math.PI / 2);
  const maxTheta = turns * 2 * Math.PI;
  const a = r / Math.exp(b * maxTheta);
  const points = [];
  for (let t = 0; t <= maxTheta; t += 0.04) {
    const rad = a * Math.exp(b * t);
    points.push(`${(cx + rad * Math.cos(t)).toFixed(2)} ${(cy + rad * Math.sin(t)).toFixed(2)}`);
  }
  return `M${points.join(' L')}`;
}
