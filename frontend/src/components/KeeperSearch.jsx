import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchKeepers } from '../api/market';
import { errorMessage } from '../api/client';
import { SPECIES, SPECIES_LABELS, formatPrice, stars } from '../utils/format';
import { BookingRequestForm } from './BookingRequestForm';
import './marketplace.css';

export const Rating = ({ rating }) =>
  rating.count > 0 ? (
    <span className="rating" title={`${rating.average} out of 5`}>
      {stars(rating.average)} <span className="cardMeta">({rating.count})</span>
    </span>
  ) : (
    <span className="cardMeta">No reviews yet</span>
  );

export const KeeperCard = ({ keeper, pets, canBook, onBooked }) => {
  const [booking, setBooking] = useState(false);

  return (
    <div className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">
          {keeper.firstName} {keeper.lastName}
        </h3>
        <span className="price">{formatPrice(keeper.dailyRate)}/day</span>
      </div>
      <div className="cardMeta">
        {keeper.city}, {keeper.country}
      </div>
      <Rating rating={keeper.rating} />
      <div className="chips">
        {keeper.acceptedSpecies.map((s) => (
          <span className="chip" key={s}>
            {SPECIES_LABELS[s]}
          </span>
        ))}
      </div>
      <p className="hint">{keeper.bio.length > 140 ? `${keeper.bio.slice(0, 140)}…` : keeper.bio}</p>

      {booking ? (
        <BookingRequestForm
          keeper={keeper}
          pets={pets}
          onCancel={() => setBooking(false)}
          onDone={() => {
            setBooking(false);
            onBooked?.();
          }}
        />
      ) : (
        <div className="actions">
          <Link className="btn btn-secondary" to={`/keepers/${keeper.userName}`}>
            Profile and reviews
          </Link>
          {canBook && (
            <button className="btn" onClick={() => setBooking(true)}>
              Request booking
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Search form plus results. Owners (canBook) can request a booking from a card.
export const KeeperSearch = ({ pets = [], canBook = false, onBooked }) => {
  const [filters, setFilters] = useState({ city: '', species: '', maxRate: '' });
  const [keepers, setKeepers] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const runSearch = useCallback((current) => {
    setError(null);
    searchKeepers(current)
      .then(setKeepers)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    runSearch({});
  }, [runSearch]);

  const update = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  return (
    <section className="panel">
      <h2 className="panelTitle">Find a pet keeper</h2>
      <form
        className="formRow searchBar"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(filters);
        }}
      >
        <label className="field">
          City
          <input value={filters.city} onChange={update('city')} placeholder="Any city" />
        </label>
        <label className="field">
          Pet
          <select value={filters.species} onChange={update('species')}>
            <option value="">Any pet</option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {SPECIES_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Max price per day (€)
          <input type="number" min="1" value={filters.maxRate} onChange={update('maxRate')} placeholder="Any" />
        </label>
        <button className="btn" type="submit">
          Search
        </button>
      </form>

      {notice && <p className="success">{notice}</p>}
      {error && <p className="error">{error}</p>}
      {keepers && keepers.length === 0 && <div className="empty">No keepers match these filters.</div>}
      {keepers && keepers.length > 0 && (
        <div className="cardGrid">
          {keepers.map((k) => (
            <KeeperCard
              key={k.userName}
              keeper={k}
              pets={pets}
              canBook={canBook}
              onBooked={() => {
                setNotice(`Request sent to ${k.firstName}. You'll see it under "Bookings".`);
                onBooked?.();
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};
