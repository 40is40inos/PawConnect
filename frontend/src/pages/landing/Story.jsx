// The band of crossing marquee tapes, the scroll-lit statement and the bento grid.
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { CountUp, EASE_OUT, Marquee, Reveal, Tilt } from '../../motion/kit';
import { PawIcon, StarIcon } from './icons';
import { photos } from './photos';

const SPECIES = ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Rodents', 'Reptiles', 'Fish'];
const FEATURES = ['Browse profiles', 'Read real reviews', 'Compare daily rates', 'Request a booking'];

export function MarqueeBand() {
  return (
    <section className="tapes" aria-label="Pets our keepers look after">
      <Marquee className="tape tapeBack" baseVelocity={2}>
        {FEATURES.map((f) => (
          <span className="tapeItem" key={f}>
            {f} <span className="tapeSep">✦</span>
          </span>
        ))}
      </Marquee>
      <Marquee className="tape tapeFront" baseVelocity={-3}>
        {SPECIES.map((s) => (
          <span className="tapeItem" key={s}>
            {s} <PawIcon className="tapePaw" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

const STATEMENT =
  'Leaving a pet behind shouldn’t feel like leaving family with strangers. On PawConnect every keeper has a profile, reviews from real owners and a clear daily rate, so you can choose with confidence.';
const HIGHLIGHT = new Set(['family', 'confidence.']);

function LitWord({ progress, range, highlight, children }) {
  const opacity = useTransform(progress, range, [0.13, 1]);
  return (
    <motion.span className={highlight ? 'litWord isHighlight' : 'litWord'} style={{ opacity }} aria-hidden="true">
      {children}{' '}
    </motion.span>
  );
}

export function Statement() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.82', 'end 0.42'] });
  const words = STATEMENT.split(' ');
  return (
    <section className="statement section" ref={ref}>
      <Reveal as="span" className="eyebrow" y={13}>
        <PawIcon /> Why PawConnect
      </Reveal>
      <p className="statementText" aria-label={STATEMENT}>
        {words.map((w, i) => (
          <LitWord
            key={i}
            progress={scrollYProgress}
            range={[i / words.length, (i + 1) / words.length]}
            highlight={HIGHLIGHT.has(w)}
          >
            {w}
          </LitWord>
        ))}
      </p>
    </section>
  );
}

// Tiles tip forward out of the page as they enter, then tilt under the cursor.
const tileIn = (i) => ({
  initial: { opacity: 0, y: 55, rotateX: 21 },
  whileInView: { opacity: 1, y: 0, rotateX: 0 },
  viewport: { once: true, margin: '0px 0px -10% 0px' },
  transition: { duration: 1.1, ease: EASE_OUT, delay: i * 0.08 },
});

function PhotoTile({ area, src, alt, tag, i }) {
  return (
    <motion.div className={`tileSlot ${area}`} {...tileIn(i)}>
      <Tilt className="tile tilePhoto" max={6}>
        <img src={src} alt={alt} loading="lazy" />
        {tag && <span className="tileTag">{tag}</span>}
      </Tilt>
    </motion.div>
  );
}

export function Bento({ stats }) {
  return (
    <section className="bentoSection section" aria-labelledby="bento-title">
      <div className="sectionHead">
        <Reveal as="span" className="eyebrow" y={13}>
          <PawIcon /> PawConnect in numbers
        </Reveal>
        <Reveal as="h2" id="bento-title" className="sectionTitle" delay={0.08}>
          Small community, <em>big hearts.</em>
        </Reveal>
      </div>

      <div className="bento">
        <PhotoTile
          i={0}
          area="tA"
          src={photos.ownerSpaniel}
          alt="A woman sitting on the grass hugging a brown and white spaniel"
          tag="Matched with someone local"
        />

        <motion.div className="tileSlot tB" {...tileIn(1)}>
          <Tilt className="tile tileWarm">
            <span className="tileNumber">
              <CountUp to={stats.keepers} />
            </span>
            <span className="tileLabel">keepers ready to welcome your pet</span>
            <span className="tileFoot">{stats.species} kinds of pets accepted</span>
          </Tilt>
        </motion.div>

        <PhotoTile i={2} area="tC" src={photos.sleepingCat} alt="An orange tabby cat asleep in a fluffy bed" tag="Naps included" />

        <motion.div className="tileSlot tD" {...tileIn(3)}>
          <Tilt className="tile tileInk">
            {stats.average != null ? (
              <>
                <span className="tileNumber">
                  <CountUp to={stats.average} decimals={1} />
                  <StarIcon className="tileStar" />
                </span>
                <span className="tileLabel">average from {stats.reviewCount} reviews</span>
              </>
            ) : (
              <span className="tileLabel">Reviews appear after the first stays</span>
            )}
          </Tilt>
        </motion.div>

        <motion.div className="tileSlot tE" {...tileIn(4)}>
          <Tilt className="tile tileGlass">
            <span className="tileNumber">
              <CountUp to={stats.cities.length} />
            </span>
            <span className="tileLabel">{stats.cities.length === 1 ? 'city' : 'cities'}, and growing</span>
            <span className="cityChips">
              {stats.cities.map((c) => (
                <span className="cityChip" key={c}>
                  {c}
                </span>
              ))}
            </span>
          </Tilt>
        </motion.div>

        <PhotoTile i={5} area="tF" src={photos.rabbit} alt="A white and brown lop-eared rabbit on the grass" tag="Not just cats & dogs" />
      </div>
    </section>
  );
}
