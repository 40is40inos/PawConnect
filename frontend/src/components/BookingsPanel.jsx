import { useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { acceptBooking, cancelBooking, declineBooking, reviewBooking } from '../api/market';
import { errorMessage } from '../api/client';
import {
  SPECIES_LABELS,
  STATUS_LABELS,
  daysInclusive,
  formatDate,
  formatPrice,
  stars,
  todayISO,
} from '../utils/format';
import { hueFor } from '../utils/avatar';
import { EASE_OUT } from '../motion/kit';
import { StarIcon } from '../pages/landing/icons';
import './marketplace.css';
import './dashboard.css';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ReviewForm = ({ booking, onDone }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    reviewBooking(booking.id, { rating: Number(rating), comment: comment.trim() || null })
      .then(onDone)
      .catch((err) => setError(errorMessage(err)));
  };

  return (
    <motion.form
      className="form reviewForm"
      onSubmit={onSubmit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
    >
      <div className="formRow reviewRatingRow">
        <label className="field">
          Rating
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {stars(n)} ({n})
              </option>
            ))}
          </select>
        </label>
        {/* A live preview of the chosen rating. */}
        <span className="starPreview" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.span
              key={n}
              animate={{ scale: n <= rating ? 1 : 0.78, opacity: n <= rating ? 1 : 0.3 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: n * 0.03 }}
            >
              <StarIcon />
            </motion.span>
          ))}
        </span>
      </div>
      <label className="field">
        How did it go? (optional)
        <textarea value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn" type="submit">
          Post review
        </button>
      </div>
    </motion.form>
  );
};

// A tick that draws itself, shown on an action button once the server agrees.
const DrawnCheck = () => (
  <svg className="drawnCheck" viewBox="0 0 24 24" aria-hidden="true">
    <motion.path
      d="M5 12.5l4.5 4.5L19 7.5"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    />
  </svg>
);

// Shows a spinner while the request runs and a drawn tick when it is done.
const ActionButton = ({ id, state, className, onClick, children }) => (
  <motion.button
    className={`btn actionBtn ${className}`}
    onClick={onClick}
    disabled={state.busy !== null}
    whileTap={{ scale: 0.94 }}
  >
    {state.done === id ? (
      <DrawnCheck />
    ) : (
      state.busy === id && <span className="btnSpinner" aria-hidden="true" />
    )}
    {children}
  </motion.button>
);

// Ring colours for the moment an action succeeds. Literal colours (not CSS
// variables) so the shadow can animate.
const FLASH = { accept: '#419d78', decline: '#7a7fa6', cancel: '#7a7fa6' };
const RESTING_SHADOW = '0 0 0 0px rgba(0, 0, 0, 0), 0 8px 21px -8px rgba(0, 0, 0, 0.35)';
const flashShadow = (c) => `0 0 0 2px ${c}, 0 21px 55px -21px ${c}`;

const BookingCard = ({ booking, role, onChange }) => {
  const reduce = useReducedMotion();
  const [error, setError] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [action, setAction] = useState({ busy: null, done: null });
  const isKeeper = role === 'PETKEEPER';
  const { pet, otherParty } = booking;
  const statusKey = booking.completed ? 'COMPLETED' : booking.status;
  const statusLabel = booking.completed
    ? 'Completed'
    : isKeeper && booking.status === 'REQUESTED'
      ? 'Needs your answer'
      : STATUS_LABELS[booking.status];
  const days = daysInclusive(booking.startDate, booking.endDate);

  // Run the request, let the tick draw, then refresh: the card then flies
  // to its new section.
  const act = (id, request, confirmText) => () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    setAction({ busy: id, done: null });
    request(booking.id)
      .then(() => {
        setAction({ busy: id, done: id });
        return wait(reduce ? 0 : 650);
      })
      .then(onChange)
      .catch((err) => {
        setError(errorMessage(err));
        setAction({ busy: null, done: null });
      });
  };

  const canCancel =
    !isKeeper &&
    (booking.status === 'REQUESTED' || (booking.status === 'ACCEPTED' && booking.startDate > todayISO()));

  return (
    <motion.div
      layoutId={`booking-${booking.id}`}
      className={`card bookingCard status-${statusKey}`}
      style={{ '--hue': hueFor(pet.name) }}
      initial={{ opacity: 0, y: 21 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: action.done ? flashShadow(FLASH[action.done]) : RESTING_SHADOW,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease: EASE_OUT, layout: { type: 'spring', stiffness: 220, damping: 28 } }}
    >
      <div className="bookingTop">
        <span className="petBadge" aria-hidden="true">
          {pet.name[0]}
        </span>
        <h3 className="cardTitle">
          {pet.name} <span className="cardMeta">({SPECIES_LABELS[pet.species]})</span>
        </h3>
        <span className={`badge badge-${statusKey}`}>{statusLabel}</span>
      </div>

      <div className="stayLine">
        <span className="stayDate">{formatDate(booking.startDate)}</span>
        <span className="stayTrack" aria-hidden="true">
          <span />
        </span>
        <span className="stayDate">{formatDate(booking.endDate)}</span>
      </div>
      <div className="stayMeta">
        {days} {days === 1 ? 'day' : 'days'} · <span className="price">{formatPrice(booking.totalPrice)}</span>
      </div>

      <dl className="details">
        <dt>{isKeeper ? 'Owner' : 'Keeper'}</dt>
        <dd>
          {otherParty ? `${otherParty.firstName} ${otherParty.lastName}, ${otherParty.city}` : 'Deleted user'}
        </dd>
        {otherParty?.phoneNumber && (
          <>
            <dt>Phone</dt>
            <dd>
              <a className="backLink" href={`tel:${otherParty.phoneNumber}`}>
                {otherParty.phoneNumber}
              </a>
            </dd>
            <dt>Email</dt>
            <dd>
              <a className="backLink" href={`mailto:${otherParty.email}`}>
                {otherParty.email}
              </a>
            </dd>
          </>
        )}
        {isKeeper && pet.breed && (
          <>
            <dt>Breed</dt>
            <dd>{pet.breed}</dd>
          </>
        )}
      </dl>

      {booking.message && <p className="quote">“{booking.message}”</p>}
      {isKeeper && pet.careNotes && (
        <p className="hint">
          <strong>Care notes:</strong> {pet.careNotes}
        </p>
      )}
      {booking.status === 'REQUESTED' && !isKeeper && (
        <p className="hint">Contact details are shared once the keeper accepts.</p>
      )}
      {booking.review && (
        <p className="hint">
          Review: <span className="rating">{stars(booking.review.rating)}</span>
          {booking.review.comment && ` “${booking.review.comment}”`}
        </p>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      <div className="actions">
        {isKeeper && booking.status === 'REQUESTED' && (
          <>
            <ActionButton id="accept" state={action} className="btn-accept" onClick={act('accept', acceptBooking)}>
              Accept
            </ActionButton>
            <ActionButton
              id="decline"
              state={action}
              className="btn-secondary"
              onClick={act('decline', declineBooking, 'Decline this request?')}
            >
              Decline
            </ActionButton>
          </>
        )}
        {canCancel && (
          <ActionButton
            id="cancel"
            state={action}
            className="btn-secondary"
            onClick={act('cancel', cancelBooking, 'Cancel this booking?')}
          >
            {booking.status === 'REQUESTED' ? 'Withdraw request' : 'Cancel booking'}
          </ActionButton>
        )}
        {booking.canReview && !reviewing && (
          <button className="btn" onClick={() => setReviewing(true)}>
            Review keeper
          </button>
        )}
      </div>
      {reviewing && booking.canReview && (
        <ReviewForm
          booking={booking}
          onDone={() => {
            setReviewing(false);
            onChange();
          }}
        />
      )}
    </motion.div>
  );
};

export const BookingsPanel = ({ bookings, role, onChange }) => {
  const isKeeper = role === 'PETKEEPER';
  const today = todayISO();
  const waiting = bookings.filter((b) => b.status === 'REQUESTED');
  const upcoming = bookings.filter((b) => b.status === 'ACCEPTED' && b.endDate >= today);
  const past = bookings.filter((b) => !waiting.includes(b) && !upcoming.includes(b));

  const section = (title, list, emptyText) => (
    <div className="bookingSection">
      <h3 className="cardTitle">
        {title} {list.length > 0 && <span className="count">{list.length}</span>}
      </h3>
      {list.length === 0 ? (
        emptyText && <p className="hint">{emptyText}</p>
      ) : (
        <div className="cardGrid">
          <AnimatePresence initial={false}>
            {list.map((b) => (
              <BookingCard key={b.id} booking={b} role={role} onChange={onChange} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  return (
    <section className="panel">
      <h2 className="panelTitle">{isKeeper ? 'Booking requests' : 'My bookings'}</h2>
      {bookings.length === 0 && (
        <div className="empty">
          {isKeeper
            ? 'No requests yet. Make sure your keeper profile is complete so owners can find you.'
            : 'No bookings yet. Find a keeper to send your first request.'}
        </div>
      )}
      {bookings.length > 0 && (
        // One layout group, so a card whose status changes flies to its new section.
        <LayoutGroup id="bookings">
          {section(isKeeper ? 'Waiting for your answer' : 'Waiting for the keeper', waiting, 'Nothing waiting.')}
          {section('Upcoming stays', upcoming, 'No upcoming stays.')}
          {past.length > 0 && section('Past and closed', past)}
        </LayoutGroup>
      )}
    </section>
  );
};
