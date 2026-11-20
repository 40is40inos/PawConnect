import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGroup, motion, useIsPresent } from 'motion/react';
import { getPetOwners } from '../../api/users';
import { getBookings, getKeeperProfile, getPets } from '../../api/market';
import { errorMessage } from '../../api/client';
import { KeeperSearch } from '../../components/KeeperSearch';
import { PetsPanel } from '../../components/PetsPanel';
import { BookingsPanel } from '../../components/BookingsPanel';
import { KeeperProfileForm } from '../../components/KeeperProfileForm';
import { ProfileForm } from '../../components/ProfileForm';
import { DisplayUsers } from '../../components/displayUsers/displayUsers';
import { Landing } from '../landing/Landing';
import { useSession } from '../../session';
import '../../components/marketplace.css';

const OWNER_TABS = [
  ['find', 'Find a keeper'],
  ['pets', 'My pets'],
  ['bookings', 'Bookings'],
  ['details', 'My details'],
];
const KEEPER_TABS = [
  ['bookings', 'Requests'],
  ['profile', 'Keeper profile'],
  ['owners', 'Pet owners'],
  ['details', 'My details'],
];

export const MainPage = () => {
  const navigate = useNavigate();
  const { me: user, setMe: setUser } = useSession();
  const isPresent = useIsPresent();
  const [tab, setTab] = useState(null);
  const [pets, setPets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [keeperProfile, setKeeperProfile] = useState(undefined); // undefined = not loaded yet
  const [owners, setOwners] = useState(null);
  const [error, setError] = useState(null);

  const isKeeper = user?.type === 'PETKEEPER';
  const fail = (err) => setError(errorMessage(err));

  const loadBookings = useCallback(() => getBookings().then(setBookings).catch(fail), []);
  const loadPets = useCallback(() => getPets().then(setPets).catch(fail), []);

  // Load the dashboard once we know who is logged in. Depends on the user's
  // identity only, so saving "My details" doesn't reload everything.
  const userName = user?.userName;
  const role = user?.role;
  const type = user?.type;
  useEffect(() => {
    if (!userName) return;
    if (role === 'ADMIN') {
      navigate('/admin');
      return;
    }
    if (type === 'PETKEEPER') {
      getKeeperProfile()
        .then((profile) => {
          setKeeperProfile(profile);
          setTab(profile ? 'bookings' : 'profile');
        })
        .catch(fail);
    } else {
      setTab('find');
      loadPets();
    }
    loadBookings();
  }, [userName, role, type, navigate, loadBookings, loadPets]);

  useEffect(() => {
    if (tab === 'owners' && owners === null) getPetOwners().then(setOwners).catch(fail);
  }, [tab, owners]);

  // While this page animates out after logging out, show nothing rather than
  // flashing the landing page.
  if (user === null) return isPresent ? <Landing /> : null;
  if (!user || role === 'ADMIN') return null;

  const waiting = bookings.filter((b) => b.status === 'REQUESTED').length;
  const tabs = isKeeper ? KEEPER_TABS : OWNER_TABS;

  return (
    <div className="dashboard">
      <header className="dashboardHeader">
        <div>
          <h1 className="dashboardTitle">Hi {user.firstName}</h1>
          <span className="cardMeta">{isKeeper ? 'Pet keeper' : 'Pet owner'} · {user.city}</span>
        </div>
      </header>

      <LayoutGroup id="dashboardTabs">
        <nav className="tabs" role="tablist">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className="tab"
              role="tab"
              aria-selected={tab === key}
              onClick={() => {
                setError(null);
                setTab(key);
                if (key === 'bookings') loadBookings();
              }}
            >
              {tab === key && (
                <motion.span
                  layoutId="tabIndicator"
                  className="tabIndicator"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              {label}
              {key === 'bookings' && waiting > 0 && <span className="count">{waiting}</span>}
            </button>
          ))}
        </nav>
      </LayoutGroup>

      {error && <p className="error" role="alert">{error}</p>}

      {tab === 'find' && <KeeperSearch pets={pets} canBook onBooked={loadBookings} />}
      {tab === 'pets' && <PetsPanel pets={pets} onChange={loadPets} />}
      {tab === 'bookings' && <BookingsPanel bookings={bookings} role={user.type} onChange={loadBookings} />}
      {tab === 'profile' && keeperProfile !== undefined && (
        <KeeperProfileForm profile={keeperProfile} onSaved={setKeeperProfile} />
      )}
      {tab === 'owners' && (
        <section className="panel">
          <h2 className="panelTitle">Pet owners</h2>
          {owners && <DisplayUsers users={owners} />}
        </section>
      )}
      {tab === 'details' && <ProfileForm user={user} onSaved={setUser} />}
    </div>
  );
};
