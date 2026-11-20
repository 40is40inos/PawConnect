import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getKeeper, getPets } from '../../api/market';
import { errorMessage } from '../../api/client';
import { Rating } from '../../components/KeeperSearch';
import { BookingRequestForm } from '../../components/BookingRequestForm';
import { SPECIES_LABELS, formatDate, formatPrice, stars } from '../../utils/format';
import { useSession } from '../../session';
import '../../components/marketplace.css';

// Public keeper page with reviews. Logged-in owners can request a booking here.
export const KeeperPage = () => {
  const { userName } = useParams();
  const navigate = useNavigate();
  const [keeper, setKeeper] = useState(null);
  const { me: viewer } = useSession();
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

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

  return (
    <div className="panel">
      <Link className="backLink" to={back}>
        ← Back
      </Link>
      <div className="card">
        <div className="cardHeader">
          <h1 className="dashboardTitle">
            {keeper.firstName} {keeper.lastName}
          </h1>
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
        <p>{keeper.bio}</p>
        {keeper.phoneNumber ? (
          <dl className="details">
            <dt>Phone</dt>
            <dd>{keeper.phoneNumber}</dd>
            <dt>Email</dt>
            <dd>{keeper.email}</dd>
          </dl>
        ) : (
          <p className="hint">
            <button className="btn btn-secondary" onClick={() => navigate('/login')}>
              Log in
            </button>{' '}
            to see contact details and request a booking.
          </p>
        )}
      </div>

      {viewer?.type === 'PETOWNER' && (
        <div className="card">
          <h2 className="cardTitle">Request a booking</h2>
          {sent ? (
            <p className="success">Request sent. You'll find it under "Bookings".</p>
          ) : (
            <BookingRequestForm keeper={keeper} pets={pets} onDone={() => setSent(true)} />
          )}
        </div>
      )}

      <h2 className="panelTitle">Reviews ({keeper.reviews.length})</h2>
      {keeper.reviews.length === 0 && <div className="empty">No reviews yet.</div>}
      {keeper.reviews.map((r) => (
        <div className="card" key={r.id}>
          <div className="cardHeader">
            <span className="rating">{stars(r.rating)}</span>
            <span className="cardMeta">
              {r.ownerFirstName} · {formatDate(r.createdAt.slice(0, 10))}
            </span>
          </div>
          {r.comment && <p className="quote">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
};
