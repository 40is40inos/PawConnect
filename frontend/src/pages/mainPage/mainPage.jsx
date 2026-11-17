import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout } from '../../api/auth';
import { getPetKeepers, getPetOwners, updateMe } from '../../api/users';
import { errorMessage } from '../../api/client';
import { DisplayUsers } from '../../components/displayUsers/displayUsers';

import './mainPage.css';

const TYPE_LABELS = { PETKEEPER: 'pet keeper', PETOWNER: 'pet owner' };
const PROFILE_FIELDS = ['firstName', 'lastName', 'birthdate', 'sex', 'country', 'city', 'address', 'phoneNumber'];

export const MainPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [listing, setListing] = useState(null); // { title, users }
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    getMe()
      .then((me) => {
        if (!me) return navigate('/login');
        if (me.role === 'ADMIN') return navigate('/admin');
        setUser(me);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [navigate]);

  const onLogout = () => logout().finally(() => navigate('/login'));

  const showListing = () => {
    setShowUpdate(false);
    setNotice(null);
    const isKeeper = user.type === 'PETKEEPER';
    (isKeeper ? getPetOwners() : getPetKeepers())
      .then((users) => setListing({ title: isKeeper ? 'Pet owners' : 'Pet keepers', users }))
      .catch((err) => setError(errorMessage(err)));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const changes = Object.fromEntries(PROFILE_FIELDS.map((f) => [f, form[f].value]));
    // Only send password fields when the user wants to change the password.
    if (form.newPassword.value) {
      changes.password = form.newPassword.value;
      changes.currentPassword = form.currentPassword.value;
    }

    setError(null);
    updateMe(changes)
      .then((updated) => {
        setUser(updated);
        setShowUpdate(false);
        setNotice('Your details were saved.');
      })
      .catch((err) => setError(errorMessage(err)));
  };

  if (!user) return error ? <div className="loginError">{error}</div> : null;

  const updateForm = (
    <form onSubmit={onSubmit} className="mainPageForm">
      Update your details:
      <label>
        First name:
        <input name="firstName" type="text" defaultValue={user.firstName} required />
      </label>
      <label>
        Last name:
        <input name="lastName" type="text" defaultValue={user.lastName} required />
      </label>
      <label>
        Birthdate:
        <input name="birthdate" type="date" defaultValue={user.birthdate} required />
      </label>
      <label>
        Sex:
        <select name="sex" defaultValue={user.sex}>
          <option value="F">Female</option>
          <option value="M">Male</option>
          <option value="O">Other</option>
        </select>
      </label>
      <label>
        Country:
        <input name="country" type="text" defaultValue={user.country} required />
      </label>
      <label>
        City:
        <input name="city" type="text" defaultValue={user.city} required />
      </label>
      <label>
        Address:
        <input name="address" type="text" defaultValue={user.address} required />
      </label>
      <label>
        Phone number:
        <input
          name="phoneNumber"
          type="tel"
          defaultValue={user.phoneNumber}
          pattern="\+?[0-9]{7,15}"
          required
        />
      </label>
      <label>
        New password (leave empty to keep):
        <input name="newPassword" type="password" autoComplete="new-password" minLength={8} />
      </label>
      <label>
        Current password (needed for a new password):
        <input name="currentPassword" type="password" autoComplete="current-password" />
      </label>

      <div className="buttons">
        <button className="submitButton" type="submit">
          Save
        </button>
        <button className="submitButton" type="button" onClick={() => setShowUpdate(false)}>
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="mainPage">
      <div className="mainPageTitle">
        Welcome {TYPE_LABELS[user.type]} {user.firstName} {user.lastName}
      </div>
      {error && <div className="loginError" role="alert">{error}</div>}
      {notice && <div>{notice}</div>}
      <div className="mainPageBody">
        {showUpdate && updateForm}
        {!showUpdate && listing && (
          <div className="listing">
            {listing.title}
            <DisplayUsers users={listing.users} />
          </div>
        )}
      </div>
      <div className="footer">
        <button onClick={onLogout}>Logout</button>
        <button onClick={showListing}>
          {user.type === 'PETKEEPER' ? 'Pet owners' : 'Pet keepers'}
        </button>
        <button
          onClick={() => {
            setShowUpdate((old) => !old);
            setListing(null);
            setNotice(null);
          }}
        >
          Update details
        </button>
      </div>
    </div>
  );
};
