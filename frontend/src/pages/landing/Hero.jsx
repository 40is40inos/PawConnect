import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { EASE_OUT, Reveal, SplitWords, goldenSpiralPath, usePointerParallax } from '../../motion/kit';
import { ArrowIcon, CheckIcon, PawIcon, StarIcon } from './icons';
import { photos } from './photos';
import { hueFor, initials } from '../../utils/avatar';

// The arch is 100 × 127.2 (1 : √φ); the spiral's eye sits on its golden point,
// 61.8% across and 38.2% down.
const SPIRAL = goldenSpiralPath(61.8, 127.2 * 0.382, 62, 3);
const BADGE_TEXT = 'trusted keepers • happy pets • pawconnect • ';

// A layer that drifts with the pointer; bigger depth = closer to the viewer.
function Depth({ px, py, depth, className, style, children }) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth);
  return (
    <motion.div className={className} style={{ ...style, x, y }}>
      {children}
    </motion.div>
  );
}

const bob = (distance, duration, delay = 0) => ({
  animate: { y: [0, -distance, 0], rotate: [-1.5, 1.5, -1.5] },
  transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' },
});


export function Hero({ stats, keepers }) {
  const ref = useRef(null);
  const { px, py } = usePointerParallax(ref);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 89]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -55]);
  const ghostX = useTransform(scrollYProgress, [0, 1], ['0%', '-21%']);

  return (
    <section className="hero" ref={ref}>
      <motion.div className="heroGhost" style={{ x: ghostX }} aria-hidden="true">
        pawconnect
      </motion.div>

      <motion.div className="heroCopy" style={{ y: copyY }}>
        <Reveal as="span" className="eyebrow" y={13}>
          <span className="pulseDot" /> Local pet keepers across Greece
        </Reveal>

        <SplitWords
          className="heroTitle"
          delay={0.15}
          parts={[{ text: 'Care that feels like ' }, { text: 'home,', className: 'accentWord' }, { text: ' while you’re away.' }]}
        />

        <Reveal as="p" className="heroLead" delay={0.75}>
          Find a local keeper for your dog, cat, bird, rabbit and more. Read reviews from other owners, compare
          daily rates and send a booking request in a couple of taps.
        </Reveal>

        <Reveal className="heroActions" delay={0.9}>
          <Link className="pill pillPrimary" to="/guest">
            Find a keeper <ArrowIcon className="pillArrow" />
          </Link>
          <Link className="pill pillGhost" to="/register">
            Become a keeper
          </Link>
        </Reveal>

        {stats && (
          <Reveal className="heroProof" delay={1.05}>
            <span className="avatarStack" aria-hidden="true">
              {keepers.slice(0, 4).map((k) => (
                <span className="avatar" key={k.userName} style={{ '--hue': hueFor(k.userName) }}>
                  {initials(k)}
                </span>
              ))}
            </span>
            <span>
              {stats.average != null && (
                <strong>
                  <StarIcon className="starInline" /> {stats.average.toFixed(1)}
                </strong>
              )}{' '}
              from {stats.reviewCount} {stats.reviewCount === 1 ? 'review' : 'reviews'} · {stats.keepers} keepers in{' '}
              {stats.cities.length} {stats.cities.length === 1 ? 'city' : 'cities'}
            </span>
          </Reveal>
        )}
      </motion.div>

      <motion.div className="heroVisual" style={{ y: visualY }}>
        <Depth px={px} py={py} depth={-13} className="heroBlob" />

        <Depth px={px} py={py} depth={8} className="archOutlineWrap">
          <motion.div
            className="archOutline"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: -5 }}
            transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.6 }}
          />
        </Depth>

        <Depth px={px} py={py} depth={13} className="archWrap">
          <motion.div
            className="arch"
            initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            transition={{ duration: 1.3, ease: EASE_OUT, delay: 0.2 }}
          >
            <motion.img
              src={photos.heroOwnerGolden}
              alt="A woman kneeling on a path, kissing her golden retriever on the cheek"
              style={{ y: imageY }}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1.18 }}
              transition={{ duration: 1.8, ease: EASE_OUT, delay: 0.2 }}
            />
          </motion.div>
        </Depth>

        <Depth px={px} py={py} depth={13} className="archWrap spiralWrap">
          <svg className="heroSpiral" viewBox="0 0 100 127.2" aria-hidden="true">
            <motion.path
              d={SPIRAL}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.6, ease: EASE_OUT, delay: 1 }}
            />
          </svg>
        </Depth>

        <Depth px={px} py={py} depth={34} className="floatSlot floatBooking">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 21 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 1.2 }}
          >
            <motion.div className="glassCard" {...bob(8, 5.5)}>
              <span className="glassIcon">
                <CheckIcon />
              </span>
              <span>
                <strong>Request accepted</strong>
                <small>Rex · 3 nights · €66</small>
              </span>
            </motion.div>
          </motion.div>
        </Depth>

        {stats && (
          <Depth px={px} py={py} depth={21} className="floatSlot floatRate">
            <motion.div
              className="rateChip"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 1.45 }}
            >
              from <strong>€{stats.fromRate}</strong>/day
            </motion.div>
          </Depth>
        )}

        <Depth px={px} py={py} depth={55} className="floatSlot floatCat">
          <motion.div
            initial={{ opacity: 0, x: -89, rotate: -21 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 1.3, ease: EASE_OUT, delay: 0.85 }}
          >
            <motion.img className="catCutout" src={photos.catCutout} alt="" {...bob(13, 6.85, 2)} />
          </motion.div>
        </Depth>

        <Depth px={px} py={py} depth={21} className="floatSlot floatBadge">
          <motion.div
            className="heroBadge"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE_OUT, delay: 1.3 }}
          >
            <svg className="badgeRing" viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <path id="badgeCircle" d="M50 50 m-37 0 a37 37 0 1 1 74 0 a37 37 0 1 1 -74 0" />
              </defs>
              <text>
                <textPath href="#badgeCircle">{BADGE_TEXT}</textPath>
              </text>
            </svg>
            <PawIcon className="badgePaw" />
          </motion.div>
        </Depth>
      </motion.div>
    </section>
  );
}
