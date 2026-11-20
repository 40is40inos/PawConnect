// Featured keepers as a 3D cover-flow: side cards turn away and sink back.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Reveal } from '../../motion/kit';
import { SPECIES_LABELS, formatPrice } from '../../utils/format';
import { ArrowIcon, ChevronIcon, PawIcon, StarIcon } from './icons';
import { hueFor, initials } from '../../utils/avatar';

const AUTOPLAY_MS = 4236; // φ³ seconds, roughly

function Stars({ rating }) {
  if (!rating.count) return <span className="coverMeta">New on PawConnect</span>;
  return (
    <span className="coverStars" aria-label={`${rating.average} out of 5 from ${rating.count} reviews`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={n <= Math.round(rating.average) ? 'on' : ''} />
      ))}
      <span className="coverMeta">({rating.count})</span>
    </span>
  );
}

export function KeeperCarousel({ keepers }) {
  const reduce = useReducedMotion();
  const n = keepers.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((step) => setActive((a) => (a + step + n) % n), [n]);

  useEffect(() => {
    if (paused || reduce || n < 2) return undefined;
    const id = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, reduce, n, go]);

  return (
    <section
      id="keepers"
      className="keepers section"
      aria-labelledby="keepers-title"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
    >
      <div className="sectionHead sectionHeadRow">
        <div>
          <Reveal as="span" className="eyebrow" y={13}>
            <PawIcon /> Meet the keepers
          </Reveal>
          <Reveal as="h2" id="keepers-title" className="sectionTitle" delay={0.08}>
            Real people, <em>real laps.</em>
          </Reveal>
        </div>
        {n > 1 && (
          <div className="coverNav">
            <button className="roundBtn" onClick={() => go(-1)} aria-label="Previous keeper">
              <ChevronIcon left />
            </button>
            <button className="roundBtn" onClick={() => go(1)} aria-label="Next keeper">
              <ChevronIcon />
            </button>
          </div>
        )}
      </div>

      <motion.div
        className="coverflow"
        drag={n > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -55) go(1);
          else if (info.offset.x > 55) go(-1);
        }}
      >
        {keepers.map((k, i) => {
          let offset = i - active;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;
          const distance = Math.abs(offset);
          const isActive = offset === 0;
          return (
            <motion.article
              key={k.userName}
              className={`coverCard ${isActive ? 'isActive' : ''}`}
              style={{ zIndex: 10 - distance, '--hue': hueFor(k.userName) }}
              initial={false}
              animate={{
                x: `${offset * 64}%`,
                rotateY: offset * -34,
                z: -distance * 144,
                scale: 1 - distance * 0.06,
                opacity: distance > 2 ? 0 : 1 - distance * 0.28,
              }}
              transition={{ type: 'spring', stiffness: 150, damping: 23 }}
              onClick={() => !isActive && setActive(i)}
              aria-hidden={!isActive}
            >
              <div className="coverTop">
                <span className="coverAvatar">{initials(k)}</span>
                <span className="coverPrice">
                  {formatPrice(k.dailyRate)}
                  <small>/day</small>
                </span>
              </div>
              <h3 className="coverName">
                {k.firstName} {k.lastName}
              </h3>
              <span className="coverMeta">
                {k.city}, {k.country}
              </span>
              <Stars rating={k.rating} />
              <span className="coverChips">
                {k.acceptedSpecies.map((s) => (
                  <span className="coverChip" key={s}>
                    {SPECIES_LABELS[s]}
                  </span>
                ))}
              </span>
              <p className="coverBio">{k.bio.length > 120 ? `${k.bio.slice(0, 120)}…` : k.bio}</p>
              <Link className="coverLink" to={`/keepers/${k.userName}`} tabIndex={isActive ? 0 : -1} draggable={false}>
                View profile <ArrowIcon />
              </Link>
            </motion.article>
          );
        })}
      </motion.div>

      {n > 1 && (
        <div className="coverDots">
          {keepers.map((k, i) => (
            <button
              key={k.userName}
              className={i === active ? 'isActive' : ''}
              onClick={() => setActive(i)}
              aria-label={`Show ${k.firstName}`}
              aria-current={i === active}
            />
          ))}
        </div>
      )}

      <Reveal className="centerAction">
        <Link className="pill pillGhost" to="/guest">
          See all keepers <ArrowIcon className="pillArrow" />
        </Link>
      </Reveal>
    </section>
  );
}
