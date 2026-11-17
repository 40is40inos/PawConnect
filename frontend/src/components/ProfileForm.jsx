import { useState } from 'react';
import { updateMe } from '../api/users';
import { errorMessage } from '../api/client';
import './marketplace.css';

const FIELDS = ['firstName', 'lastName', 'birthdate', 'sex', 'country', 'city', 'address', 'phoneNumber'];

// The user's own account details. Username, email and account type are fixed.
export const ProfileForm = ({ user, onSaved }) => {
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const changes = Object.fromEntries(FIELDS.map((f) => [f, form[f].value]));
    // Only send password fields when the user wants to change the password.
    if (form.newPassword.value) {
      changes.password = form.newPassword.value;
      changes.currentPassword = form.currentPassword.value;
    }
    setError(null);
    setNotice(null);
    updateMe(changes)
      .then((updated) => {
        form.newPassword.value = '';
        form.currentPassword.value = '';
        setNotice('Your details were saved.');
        onSaved(updated);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  return (
    <section className="panel">
      <h2 className="panelTitle">My details</h2>
      <p className="hint">
        Username <strong>{user.userName}</strong> · {user.email}
      </p>
      <form className="card form" onSubmit={onSubmit}>
        <div className="formRow">
          <label className="field">
            First name
            <input name="firstName" defaultValue={user.firstName} required />
          </label>
          <label className="field">
            Last name
            <input name="lastName" defaultValue={user.lastName} required />
          </label>
        </div>
        <div className="formRow">
          <label className="field">
            Birthdate
            <input name="birthdate" type="date" defaultValue={user.birthdate} required />
          </label>
          <label className="field">
            Sex
            <select name="sex" defaultValue={user.sex}>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="O">Other</option>
            </select>
          </label>
          <label className="field">
            Phone number
            <input name="phoneNumber" type="tel" defaultValue={user.phoneNumber} pattern="\+?[0-9]{7,15}" required />
          </label>
        </div>
        <div className="formRow">
          <label className="field">
            Country
            <input name="country" defaultValue={user.country} required />
          </label>
          <label className="field">
            City
            <input name="city" defaultValue={user.city} required />
          </label>
          <label className="field">
            Address
            <input name="address" defaultValue={user.address} required />
          </label>
        </div>
        <div className="formRow">
          <label className="field">
            New password (leave empty to keep)
            <input name="newPassword" type="password" autoComplete="new-password" minLength={8} />
          </label>
          <label className="field">
            Current password (needed for a new password)
            <input name="currentPassword" type="password" autoComplete="current-password" />
          </label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="success">{notice}</p>}
        <div className="actions">
          <button className="btn" type="submit">
            Save
          </button>
        </div>
      </form>
    </section>
  );
};
