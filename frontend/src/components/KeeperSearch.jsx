import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { searchKeepers } from '../api/market';
import { errorMessage } from '../api/client';
import { SPECIES, SPECIES_LABELS, formatPrice, stars } from '../utils/format';
import { hueFor, initials } from '../utils/avatar';
import { EASE_OUT, Tilt } from '../motion/kit';
import { GridIcon, ListIcon, PinIcon, SearchIcon, StarIcon } from '../pages/landing/icons';
import { BookingRequestForm } from './BookingRequestForm';
import './marketplace.css';
import './keeperSearch.css';

export const Rating = ({ rating }) =>
  rating.count > 0 ? (
    <span className="rating" title={`${rating.average} out of 5`}>
      {stars(rating.average)} <span className="cardMeta">({rating.count})</span>
    </span>
  ) : (
    <span className="cardMeta">No reviews yet</span>
  );

const SORTS = [
  { key: 'price', label: 'Lowest price' }, // the server's order
  { key: 'rating', label: 'Top rated' },
  { key: 'reviews', label: 'Most reviews' },
];

const sortKeepers = (keepers, sort) => {
  if (sort === 'price') return keepers;
  const by =
    sort === 'rating'
      ? (a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0) || b.rating.count - a.rating.count
      : (a, b) => b.rating.count - a.rating.count || (b.rating.average ?? 0) - (a.rating.average ?? 0);
  return [...keepers].sort(by);
};

// "2 dog keepers in Heraklion up to €25.00/day"
const resultsLabel = ({ city, species, maxRate }, n) => {
  const noun = n === 1 ? 'keeper' : 'keepers';
  const what = species ? `${SPECIES_LABELS[species].toLowerCase()} ${noun}` : noun;
  const where = city ? ` in ${city.trim().replace(/^./, (c) => c.toUpperCase())}` : '';
  const price = maxRate ? ` up to ${formatPrice(Number(maxRate))}/day` : '';
  return `${what}${where}${price}`;
};

// One result. Tilts towards the pointer, except while its booking form is open.
export const KeeperCard = ({ keeper, pets, canBook, onBooked }) => {
  const [booking, setBooking] = useState(false);
  const { rating } = keeper;

  return (
    <Tilt
      className="card keeperCard"
      max={booking ? 0 : 5}
      glare={!booking}
      style={{ '--hue': hueFor(keeper.userName) }}
    >
      <div className="keeperTop">
        <span className="keeperAvatar" aria-hidden="true">
          {initials(keeper)}
        </span>
        <div className="keeperWho">
          <h3 className="cardTitle">
            {keeper.firstName} {keeper.lastName}
          </h3>
          <span className="keeperPlace">
            <PinIcon /> {keeper.city}, {keeper.country}
          </span>
        </div>
        <span className="keeperPrice">
          <strong>{formatPrice(keeper.dailyRate)}</strong>
          <small>/day</small>
        </span>
      </div>

      <div className="keeperBody">
        <div className="keeperRating">
          {rating.count > 0 ? (
            <>
              <StarIcon className="keeperStar" />
              <strong>{rating.average.toFixed(1)}</strong>
              <span className="cardMeta">
                ({rating.count} {rating.count === 1 ? 'review' : 'reviews'})
              </span>
            </>
          ) : (
            <span className="keeperNew">New keeper · no reviews yet</span>
          )}
        </div>
        <div className="chips">
          {keeper.acceptedSpecies.map((s) => (
            <span className="chip" key={s}>
              {SPECIES_LABELS[s]}
            </span>
          ))}
        </div>
        <p className="hint keeperBio">{keeper.bio.length > 140 ? `${keeper.bio.slice(0, 140)}…` : keeper.bio}</p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {booking ? (
          <motion.div
            key="form"
            className="keeperBooking"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
          >
            <BookingRequestForm
              keeper={keeper}
              pets={pets}
              onCancel={() => setBooking(false)}
              onDone={() => {
                setBooking(false);
                onBooked?.();
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            className="actions keeperActions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Link className="btn btn-secondary" to={`/keepers/${keeper.userName}`}>
              Profile and reviews
            </Link>
            {canBook && (
              <button className="btn" onClick={() => setBooking(true)}>
                Request booking
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Tilt>
  );
};

const SkeletonCard = () => (
  <div className="skeletonCard" aria-hidden="true">
    <div className="skeletonRow">
      <span className="skeleton skeletonAvatar" />
      <span className="skeletonStack">
        <span className="skeleton" style={{ width: '61.8%' }} />
        <span className="skeleton" style={{ width: '38.2%' }} />
      </span>
    </div>
    <span className="skeleton" style={{ width: '38.2%' }} />
    <span className="skeleton" style={{ width: '100%' }} />
    <span className="skeleton" style={{ width: '82%' }} />
  </div>
);

// Results enter one after another; on a new search, cards that stay glide to
// their new place, new ones fade up and the rest shrink away.
const slot = {
  hidden: { opacity: 0, y: 21, scale: 0.97 },
  shown: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE_OUT, delay: Math.min(i, 8) * 0.055 },
  }),
  gone: { opacity: 0, scale: 0.94, transition: { duration: 0.2 } },
};

// Search form plus results. Owners (canBook) can request a booking from a card.
export const KeeperSearch = ({ pets = [], canBook = false, onBooked }) => {
  const [filters, setFilters] = useState({ city: '', species: '', maxRate: '' });
  const [applied, setApplied] = useState(filters);
  const [keepers, setKeepers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [sort, setSort] = useState('price');
  const [view, setView] = useState('grid');

  const runSearch = useCallback((current) => {
    setError(null);
    setLoading(true);
    searchKeepers(current)
      .then((found) => {
        setKeepers(found);
        setApplied(current);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    runSearch({ city: '', species: '', maxRate: '' });
  }, [runSearch]);

  const update = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));
  const filtered = Boolean(applied.city || applied.species || applied.maxRate);
  const clear = () => {
    const empty = { city: '', species: '', maxRate: '' };
    setFilters(empty);
    runSearch(empty);
  };

  const sorted = useMemo(() => (keepers ? sortKeepers(keepers, sort) : []), [keepers, sort]);

  return (
    <section className="panel">
      <h2 className="panelTitle">Find a pet keeper</h2>

      <form
        className="searchBar"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(filters);
        }}
      >
        <label className="searchField">
          <span>City</span>
          <input value={filters.city} onChange={update('city')} placeholder="Any city" />
        </label>
        <label className="searchField">
          <span>Pet</span>
          <select value={filters.species} onChange={update('species')}>
            <option value="">Any pet</option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {SPECIES_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="searchField">
          <span>Max price per day (€)</span>
          <input type="number" min="1" value={filters.maxRate} onChange={update('maxRate')} placeholder="Any" />
        </label>
        <button className="btn searchGo" type="submit" disabled={loading}>
          <SearchIcon className={loading ? 'searchSpin' : undefined} /> Search
        </button>
      </form>

      {notice && (
        <motion.p className="success" role="status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          {notice}
        </motion.p>
      )}
      {error && <p className="error">{error}</p>}

      {keepers && (
        <div className="resultsBar">
          <p className="resultsCount" aria-live="polite">
            <span className="resultsNum">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.strong
                key={keepers.length}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
              >
                  {keepers.length}
                </motion.strong>
              </AnimatePresence>
            </span>{' '}
            <span>{resultsLabel(applied, keepers.length)}</span>
            {filtered && (
              <button type="button" className="textButton" onClick={clear}>
                Clear
              </button>
            )}
          </p>

          <div className="resultsTools">
            <LayoutGroup id="sort">
              <div className="segmented" role="group" aria-label="Sort by">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className="segment"
                    aria-pressed={sort === s.key}
                    onClick={() => setSort(s.key)}
                  >
                    {sort === s.key && <motion.span layoutId="sortPill" className="segmentPill" />}
                    {s.label}
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <LayoutGroup id="view">
              <div className="segmented viewToggle" role="group" aria-label="Layout">
                {[
                  ['grid', 'Grid', GridIcon],
                  ['list', 'List', ListIcon],
                ].map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    className="segment segmentIcon"
                    aria-pressed={view === key}
                    aria-label={label}
                    title={label}
                    onClick={() => setView(key)}
                  >
                    {view === key && <motion.span layoutId="viewPill" className="segmentPill" />}
                    <Icon />
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>
        </div>
      )}

      {!keepers && loading && (
        <div className="cardGrid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {keepers && keepers.length === 0 && (
        <motion.div className="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          No keepers match these filters.{' '}
          <button type="button" className="textButton" onClick={clear}>
            Show all keepers
          </button>
        </motion.div>
      )}

      {keepers && keepers.length > 0 && (
        <motion.div
          className={`cardGrid keeperResults ${view === 'list' ? 'isList' : ''}`}
          animate={{ opacity: loading ? 0.55 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="popLayout">
            {sorted.map((k, i) => (
              <motion.div
                key={k.userName}
                className="keeperSlot"
                layout="position"
                custom={i}
                variants={slot}
                initial="hidden"
                animate="shown"
                exit="gone"
                transition={{ layout: { type: 'spring', stiffness: 260, damping: 30 } }}
              >
                <KeeperCard
                  keeper={k}
                  pets={pets}
                  canBook={canBook}
                  onBooked={() => {
                    setNotice(`Request sent to ${k.firstName}. You'll see it under "Bookings".`);
                    onBooked?.();
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};
