import { useState } from 'react';
import { acceptBooking, cancelBooking, declineBooking, reviewBooking } from '../api/market';
import { errorMessage } from '../api/client';
import { SPECIES_LABELS, STATUS_LABELS, formatDate, formatPrice, stars, todayISO } from '../utils/format';
import './marketplace.css';

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
    <form className="form" onSubmit={onSubmit}>
      <div className="formRow">
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
    </form>
  );
};

const BookingCard = ({ booking, role, onChange }) => {
  const [error, setError] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const isKeeper = role === 'PETKEEPER';
  const { pet, otherParty } = booking;
  const statusKey = booking.completed ? 'COMPLETED' : booking.status;
  const statusLabel = booking.completed
    ? 'Completed'
    : isKeeper && booking.status === 'REQUESTED'
      ? 'Needs your answer'
      : STATUS_LABELS[booking.status];

  const act = (action, confirmText) => () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    action(booking.id)
      .then(onChange)
      .catch((err) => setError(errorMessage(err)));
  };

  const canCancel =
    !isKeeper &&
    (booking.status === 'REQUESTED' || (booking.status === 'ACCEPTED' && booking.startDate > todayISO()));

  return (
    <div className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">
          {pet.name} <span className="cardMeta">({SPECIES_LABELS[pet.species]})</span>
        </h3>
        <span className={`badge badge-${statusKey}`}>{statusLabel}</span>
      </div>
      <div>
        {formatDate(booking.startDate)} – {formatDate(booking.endDate)} ·{' '}
        <span className="price">{formatPrice(booking.totalPrice)}</span>
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
            <button className="btn btn-accept" onClick={act(acceptBooking)}>
              Accept
            </button>
            <button className="btn btn-secondary" onClick={act(declineBooking, 'Decline this request?')}>
              Decline
            </button>
          </>
        )}
        {canCancel && (
          <button className="btn btn-secondary" onClick={act(cancelBooking, 'Cancel this booking?')}>
            {booking.status === 'REQUESTED' ? 'Withdraw request' : 'Cancel booking'}
          </button>
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
    </div>
  );
};

export const BookingsPanel = ({ bookings, role, onChange }) => {
  const isKeeper = role === 'PETKEEPER';
  const today = todayISO();
  const waiting = bookings.filter((b) => b.status === 'REQUESTED');
  const upcoming = bookings.filter((b) => b.status === 'ACCEPTED' && b.endDate >= today);
  const past = bookings.filter((b) => !waiting.includes(b) && !upcoming.includes(b));

  const section = (title, list, emptyText) => (
    <>
      <h3 className="cardTitle">
        {title} {list.length > 0 && <span className="count">{list.length}</span>}
      </h3>
      {list.length === 0 ? (
        emptyText && <p className="hint">{emptyText}</p>
      ) : (
        <div className="cardGrid">
          {list.map((b) => (
            <BookingCard key={b.id} booking={b} role={role} onChange={onChange} />
          ))}
        </div>
      )}
    </>
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
        <>
          {section(isKeeper ? 'Waiting for your answer' : 'Waiting for the keeper', waiting, 'Nothing waiting.')}
          {section('Upcoming stays', upcoming, 'No upcoming stays.')}
          {past.length > 0 && section('Past and closed', past)}
        </>
      )}
    </section>
  );
};
