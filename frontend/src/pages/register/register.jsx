import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';
import { errorMessage } from '../../api/client';

import './register.css';

const FIELDS = [
  'userName',
  'password',
  'email',
  'birthdate',
  'firstName',
  'lastName',
  'sex',
  'type',
  'country',
  'city',
  'address',
  'phoneNumber',
];

export const Register = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(FIELDS.map((f) => [f, e.target[f].value]));
    setSubmitting(true);
    setServerError(null);

    register(data)
      .then(() => navigate('/'))
      .catch((err) => setServerError(errorMessage(err)))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="loginBody">
      <div className="loginTitle">Register</div>
      <div className="registerForm">
        <form onSubmit={onSubmit}>
          <label>
            Username:
            <input
              name="userName"
              type="text"
              autoComplete="username"
              pattern="[A-Za-z0-9_]{3,30}"
              title="3-30 letters, digits or underscores"
              required
            />
          </label>
          <label>
            Password:
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
          <label>
            Email:
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Birthdate:
            <input name="birthdate" type="date" required />
          </label>
          <label>
            First name:
            <input name="firstName" type="text" autoComplete="given-name" required />
          </label>
          <label>
            Last name:
            <input name="lastName" type="text" autoComplete="family-name" required />
          </label>
          <label>
            Sex:
            <select name="sex" required>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="O">Other</option>
            </select>
          </label>
          <label>
            Account type:
            <select name="type" required>
              <option value="PETKEEPER">Pet keeper</option>
              <option value="PETOWNER">Pet owner</option>
            </select>
          </label>
          <label>
            Country:
            <input name="country" type="text" autoComplete="country-name" required />
          </label>
          <label>
            City:
            <input name="city" type="text" autoComplete="address-level2" required />
          </label>
          <label>
            Address:
            <input name="address" type="text" autoComplete="street-address" required />
          </label>
          <label>
            Phone number:
            <input
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              pattern="\+?[0-9]{7,15}"
              title="7-15 digits, optionally starting with +"
              required
            />
          </label>

          <div className="buttons">
            <button className="submitButton" type="submit" disabled={submitting}>
              Register
            </button>
            <button className="submitButton" type="button" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="submitButton" type="button" onClick={() => navigate('/guest')}>
              Guest
            </button>
          </div>
        </form>
      </div>
      <div className="loginError" role="alert">
        {serverError}
      </div>
    </div>
  );
};
