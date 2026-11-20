import { useEffect, useId, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { getKeeper, getPets } from '../../api/market';
import { errorMessage } from '../../api/client';
import { BookingRequestForm } from '../../components/BookingRequestForm';
import { MiniCalendar } from '../../components/MiniCalendar';
import { SPECIES_LABELS, formatDate, formatPrice, todayISO } from '../../utils/format';
import { hueFor, initials } from '../../utils/avatar';
import { CountUp, EASE_OUT, Reveal } from '../../motion/kit';
import { CheckIcon, PawIcon, PinIcon, StarIcon } from '../landing/icons';
import { photos } from '../landing/photos';
import { useSession } from '../../session';
import '../../components/marketplace.css';
import './keeperPage.css';

// A pet photo for the banner, picked from the kinds of pets the keeper takes.
function coverFor(keeper) {
  const s = keeper.acceptedSpecies;
  if (s.includes('DOG')) return hueFor(keeper.userName) % 2 ? photos.parkWalk : photos.ownerSpaniel;
  if (s.includes('CAT')) return photos.sleepingCat;
  if (s.includes('RABBIT') || s.includes('RODENT')) return photos.rabbit;
  return photos.heroOwnerGolden;
}

// Average rating as a ring that draws itself in when it scrolls into view.
function RatingRing({ rating }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const gradient = useId();
  const share = rating.count > 0 ? rating.average / 5 : 0;

  return (
    <div className="ratingRing" ref={ref}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--orange)" />
            <stop offset="55%" stopColor="var(--orange-hot)" />
            <stop offset="100%" stopColor="var(--pink)" />
          </linearGradient>
        </defs>
        <circle className="ratingTrack" cx="50" cy="50" r="42" />
        <motion.circle
          className="ratingArc"
          cx="50"
          cy="50"
          r="42"
          stroke={`url(#${gradient})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: inView ? share : 0 }}
          transition={{ duration: 1.618, ease: EASE_OUT, delay: 0.2 }}
        />
      </svg>
      <div className="ratingValue">
        {rating.count > 0 ? (
          <>
            <strong>
              <CountUp to={rating.average} decimals={1} />
            </strong>
            <small>out of 5</small>
          </>
        ) : (
          <>
            <strong className="ratingNew">New</strong>
            <small>no reviews</small>
          </>
        )}
      </div>
    </div>
  );
}

const Stars = ({ value }) => (
  <span className="reviewStarsRow" aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <StarIcon key={n} className={n <= value ? 'on' : undefined} />
    ))}
  </span>
);

// Right-hand panel: book (owners), log in (visitors) or a note (keepers).
function BookingPanel({ keeper, viewer, pets }) {
  const [dates, setDates] = useState({ start: '', end: '' });
  const [sent, setSent] = useState(false);
  const isOwner = viewer?.type === 'PETOWNER';

  return (
    <div className="bookingPanel">
      <div className="bookingPanelHead">
        <span>
          <strong className="bookingPrice">{formatPrice(keeper.dailyRate)}</strong> per day
        </span>
        {keeper.rating.count > 0 && (
          <span className="bookingRating">
            <StarIcon /> {keeper.rating.average.toFixed(1)} · {keeper.rating.count}
          </span>
        )}
      </div>

      {isOwner && !sent && (
        <>
          <h2 className="cardTitle">Request a booking</h2>
          <MiniCalendar start={dates.start} end={dates.end} min={todayISO()} onChange={setDates} />
          <BookingRequestForm
            keeper={keeper}
            pets={pets}
            dates={dates}
            onDatesChange={setDates}
            onDone={() => setSent(true)}
          />
        </>
      )}

      {isOwner && sent && (
        <motion.div className="bookingSent" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.span
            className="bookingSentIcon"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.1 }}
          >
            <CheckIcon />
          </motion.span>
          <p className="success">Request sent. You'll find it under "Bookings".</p>
          <Link className="btn btn-secondary" to="/">
            Go to my bookings
          </Link>
        </motion.div>
      )}

      {!viewer && (
        <div className="bookingGuest">
          <p className="hint">Log in as a pet owner to pick dates and send {keeper.firstName} a request.</p>
          <Link className="btn" to="/login">
            Log in to book
          </Link>
          <Link className="textLink" to="/register">
            New here? Create an account
          </Link>
        </div>
      )}

      {viewer && !isOwner && (
        <p className="hint">Booking requests come from pet owner accounts.</p>
      )}
    </div>
  );
}

// Public keeper page with reviews. Logged-in owners can request a booking here.
export const KeeperPage = () => {
  const { userName } = useParams();
  const { me: viewer } = useSession();
  const [keeper, setKeeper] = useState(null);
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const coverY = useTransform(scrollYProgress, [0, 1], ['0%', '21%']);
  const coverScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.21]);

  // Fetch once the session is known, so contact details show for members.
  const sessionKnown = viewer !== undefined;
  const isOwner = viewer?.type === 'PETOWNER';
  useEffect(() => {
    if (!sessionKnown) return;
    Promise.all([getKeeper(userName), isOwner ? getPets() : []])
      .then(([k, p]) => {
        setKeeper(k);
        setPets(p);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [userName, sessionKnown, isOwner]);

  const back = viewer ? '/' : '/guest';

  if (error) {
    return (
      <div className="panel">
        <p className="error">{error}</p>
        <Link className="backLink" to={back}>
          ← Back
        </Link>
      </div>
    );
  }
  if (!keeper) return null;

  const { rating } = keeper;

  return (
    <div className="profile" style={{ '--hue': hueFor(keeper.userName) }}>
      <Link className="backLink" to={back}>
        ← Back
      </Link>

      <header className="profileHero" ref={heroRef}>
        <motion.div
          className="profileCover"
          initial={{ clipPath: 'inset(0% 0% 100% 0% round 34px)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0% round 34px)' }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
        >
          <motion.img src={coverFor(keeper)} alt="" style={{ y: coverY, scale: coverScale }} />
        </motion.div>

        <div className="profileIdentity">
          <motion.span
            className="profileAvatar"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.5, rotate: -34 }}
            animate={{ opacity: 1, scale: 1, rotate: -6 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 0.35 }}
          >
            {initials(keeper)}
            <PawIcon className="profileAvatarPaw" />
          </motion.span>
          <motion.div
            className="profileNameBlock"
            initial={{ opacity: 0, y: 21 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.45 }}
          >
            <h1 className="profileName">
              {keeper.firstName} {keeper.lastName}
            </h1>
            <p className="profilePlace">
              <PinIcon /> {keeper.city}, {keeper.country}
            </p>
          </motion.div>
          <motion.span
            className="profileRate"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.6 }}
          >
            {`${formatPrice(keeper.dailyRate)}/day`}
          </motion.span>
        </div>
      </header>

      <div className="profileGrid">
        <Reveal className="profileCard profileStats" y={21}>
          <RatingRing rating={rating} />
          <dl className="profileFacts">
            <div>
              <dt>Reviews</dt>
              <dd>{rating.count}</dd>
            </div>
            <div>
              <dt>Pet types</dt>
              <dd>{keeper.acceptedSpecies.length}</dd>
            </div>
            <div>
              <dt>Based in</dt>
              <dd>{keeper.city}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal className="profileCard" y={21} delay={0.08}>
          <h2 className="panelTitle">About {keeper.firstName}</h2>
          <p className="profileBio">{keeper.bio}</p>
          <h3 className="profileLabel">Looks after</h3>
          <div className="chips">
            {keeper.acceptedSpecies.map((s) => (
              <span className="chip" key={s}>
                {SPECIES_LABELS[s]}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal className="profileCard" y={21} delay={0.12}>
          <h2 className="profileLabel">Contact</h2>
          {keeper.phoneNumber ? (
            <dl className="details">
              <dt>Phone</dt>
              <dd>{keeper.phoneNumber}</dd>
              <dt>Email</dt>
              <dd>{keeper.email}</dd>
            </dl>
          ) : (
            <p className="hint">
              <Link className="btn btn-secondary" to="/login">
                Log in
              </Link>{' '}
              to see contact details and request a booking.
            </p>
          )}
        </Reveal>

        <aside className="profileAside">
          <Reveal y={21} delay={0.2}>
            <BookingPanel keeper={keeper} viewer={viewer} pets={pets} />
          </Reveal>
        </aside>

        <section className="profileReviews">
          <h2 className="panelTitle">Reviews ({keeper.reviews.length})</h2>
          {keeper.reviews.length === 0 && <div className="empty">No reviews yet.</div>}
          {keeper.reviews.map((r, i) => (
            <Reveal className="profileCard reviewItem" key={r.id} y={21} delay={Math.min(i, 5) * 0.08}>
              <div className="reviewHead">
                <span className="reviewAvatar" style={{ '--hue': hueFor(r.ownerFirstName) }} aria-hidden="true">
                  {r.ownerFirstName[0]}
                </span>
                <span className="reviewWho">
                  <strong>{r.ownerFirstName}</strong>
                  <small>{formatDate(r.createdAt.slice(0, 10))}</small>
                </span>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="quote">{r.comment}</p>}
            </Reveal>
          ))}
        </section>
      </div>
    </div>
  );
};
