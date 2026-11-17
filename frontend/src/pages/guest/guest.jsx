import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPetKeepers } from '../../api/users';
import { errorMessage } from '../../api/client';
import { DisplayLinks, DisplayUsers } from '../../components/displayUsers/displayUsers';

import './guest.css';

const USEFUL_LINKS = [
  { link: 'https://www.petmd.com/', title: 'PetMD', text: 'Visit PetMD' },
  { link: 'http://katoikidio.gr/', title: 'Katoikidio.gr', text: 'Visit Katoikidio.gr' },
  { link: 'https://eshopkatoikidio.gr/', title: 'Eshop Katoikidio', text: 'Visit Eshop Katoikidio' },
];

export const Guest = () => {
  const navigate = useNavigate();
  const [petKeepers, setPetKeepers] = useState([]);
  const [error, setError] = useState(null);
  const [view, setView] = useState(null); // 'keepers' | 'links' | null

  useEffect(() => {
    getPetKeepers()
      .then(setPetKeepers)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const toggle = (name) => setView((current) => (current === name ? null : name));

  return (
    <div className="guestPage">
      <div className="buttons">
        <button onClick={() => toggle('keepers')}>
          {view === 'keepers' ? 'Close pet keepers' : 'Show pet keepers'}
        </button>
        <button onClick={() => navigate('/login')}>Login</button>
        <button onClick={() => toggle('links')}>
          {view === 'links' ? 'Close links' : 'Useful links'}
        </button>
      </div>
      {error && <div className="loginError">{error}</div>}
      {view === 'keepers' && (
        <>
          <p>Log in to see contact details.</p>
          <DisplayUsers users={petKeepers} />
        </>
      )}
      {view === 'links' && <DisplayLinks links={USEFUL_LINKS} />}
    </div>
  );
};
