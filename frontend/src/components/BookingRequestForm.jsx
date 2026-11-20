import { useState } from 'react';
import { requestBooking } from '../api/market';
import { errorMessage } from '../api/client';
import { SPECIES_LABELS, daysInclusive, formatPrice, todayISO } from '../utils/format';

// Lets an owner request a stay with a keeper for one of their pets.
// Pass `dates` and `onDatesChange` to control the dates from outside (e.g. a
// calendar next to the form).
export const BookingRequestForm = ({ keeper, pets, onDone, onCancel, dates, onDatesChange }) => {
  const eligible = pets.filter((p) => keeper.acceptedSpecies.includes(p.species));
  const [petId, setPetId] = useState(eligible[0]?.id ?? '');
  const [ownDates, setOwnDates] = useState({ start: '', end: '' });
  const { start: startDate, end: endDate } = dates ?? ownDates;
  const setDates = (next) => (onDatesChange ?? setOwnDates)({ start: startDate, end: endDate, ...next });
  const setStartDate = (start) => setDates(endDate && endDate < start ? { start, end: '' } : { start });
  const setEndDate = (end) => setDates({ end });
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (pets.length === 0) {
    return <p className="hint">Add a pet in the “My pets” tab first.</p>;
  }
  if (eligible.length === 0) {
    const accepted = keeper.acceptedSpecies.map((s) => SPECIES_LABELS[s].toLowerCase()).join(', ');
    return <p className="hint">{keeper.firstName} looks after {accepted} only.</p>;
  }

  const days = startDate && endDate && endDate >= startDate ? daysInclusive(startDate, endDate) : 0;

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    requestBooking({
      keeperUserName: keeper.userName,
      petId: Number(petId),
      startDate,
      endDate,
      message: message.trim() || null,
    })
      .then(onDone)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setSubmitting(false));
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="formRow">
        <label className="field">
          Pet
          <select value={petId} onChange={(e) => setPetId(e.target.value)} required>
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({SPECIES_LABELS[p.species]})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          From
          <input
            type="date"
            value={startDate}
            min={todayISO()}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label className="field">
          To
          <input
            type="date"
            value={endDate}
            min={startDate || todayISO()}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </label>
      </div>
      <label className="field">
        Message to the keeper (optional)
        <textarea value={message} maxLength={500} onChange={(e) => setMessage(e.target.value)} />
      </label>
      {days > 0 && (
        <p className="hint">
          {days} {days === 1 ? 'day' : 'days'} × {formatPrice(keeper.dailyRate)} ={' '}
          <span className="price">{formatPrice(days * keeper.dailyRate)}</span>
        </p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button className="btn" type="submit" disabled={submitting}>
          Send request
        </button>
        {onCancel && (
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
