// Reviews wall, the closing call to action with a peeking puppy, and the footer.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { EASE_OUT, Reveal, Tilt } from '../../motion/kit';
import { formatDate } from '../../utils/format';
import { ArrowIcon, PawIcon, StarIcon } from './icons';
import { Logo } from './LandingNav';
import { PHOTO_CREDITS, photos } from './photos';

const TILTS = [-2.5, 1.8, -1.2, 2.2, -1.8, 1.2];

export function Reviews({ reviews }) {
  return (
    <section id="reviews" className="reviews section" aria-labelledby="reviews-title">
      <div className="sectionHead">
        <Reveal as="span" className="eyebrow" y={13}>
          <PawIcon /> From the owners
        </Reveal>
        <Reveal as="h2" id="reviews-title" className="sectionTitle" delay={0.08}>
          Owners say it <em>best.</em>
        </Reveal>
      </div>
      <div className="reviewWall">
        {reviews.map((r, i) => (
          <motion.div
            key={r.id}
            className="reviewSlot"
            initial={{ opacity: 0, y: 55, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: TILTS[i % TILTS.length] }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 1, ease: EASE_OUT, delay: (i % 3) * 0.1 }}
          >
            <Tilt className="reviewCard" max={5}>
              <span className="quoteMark" aria-hidden="true">
                “
              </span>
              <span className="reviewStars" aria-label={`${r.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon key={n} className={n <= r.rating ? 'on' : ''} />
                ))}
              </span>
              <p>{r.comment}</p>
              <footer>
                <strong>{r.ownerFirstName}</strong> about{' '}
                <Link to={`/keepers/${r.keeperUserName}`}>{r.keeperName}</Link>
                <span> · {formatDate(String(r.createdAt).slice(0, 10))}</span>
              </footer>
            </Tilt>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center 0.6'] });
  const rise = useSpring(scrollYProgress, { stiffness: 90, damping: 20 });
  const puppyY = useTransform(rise, [0.35, 1], ['100%', '6%']);
  const puppyRotate = useTransform(rise, [0.35, 1], [-12, 0]);

  return (
    <section className="cta section" ref={ref}>
      <div className="ctaWrap">
        <div className="peek" aria-hidden="true">
          <motion.img src={photos.puppyCutout} alt="" style={{ y: puppyY, rotate: puppyRotate }} />
        </div>
        <motion.div
          className="ctaCard"
          initial={{ opacity: 0, y: 55, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
        >
          <h2 className="ctaTitle">
            Ready when <em>you</em> are.
          </h2>
          <p>Create a free account to book a keeper, or share your home with pets as a keeper yourself.</p>
          <div className="heroActions">
            <Link className="pill pillDark" to="/guest">
              Find a keeper <ArrowIcon className="pillArrow" />
            </Link>
            <Link className="pill pillOutlineDark" to="/register">
              Become a keeper
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="lfooter">
      <div className="lfooterInner">
        <Logo />
        <nav className="lfooterLinks" aria-label="Footer">
          <Link to="/guest">Find a keeper</Link>
          <Link to="/register">Sign up</Link>
          <Link to="/login">Log in</Link>
        </nav>
      </div>
      <p className="credits">
        Photos from Unsplash by{' '}
        {PHOTO_CREDITS.map(([user, url], i) => (
          <span key={user}>
            <a href={url} target="_blank" rel="noopener noreferrer">
              @{user}
            </a>
            {i < PHOTO_CREDITS.length - 1 ? ', ' : '.'}
          </span>
        ))}
      </p>
    </footer>
  );
}
