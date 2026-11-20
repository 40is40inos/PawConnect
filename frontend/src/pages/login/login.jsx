import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { useSession } from '../../session';

import './login.css';

export const Login = () => {
  const navigate = useNavigate();
  const { setMe } = useSession();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    const { username, password } = e.target;
    setSubmitting(true);
    setServerError(null);

    login(username.value, password.value)
      .then((profile) => {
        setMe(profile);
        navigate(profile.role === 'ADMIN' ? '/admin' : '/');
      })
      .catch((err) => setServerError(errorMessage(err)))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="loginBody">
      <div className="loginTitle">Login</div>
      <div className="loginForm">
        <form onSubmit={onSubmit}>
          <label>
            Username:
            <input name="username" type="text" autoComplete="username" required />
          </label>
          <label>
            Password:
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="submitButton" type="submit" disabled={submitting}>
            Login
          </button>
          <button className="submitButton" type="button" onClick={() => navigate('/register')}>
            Register
          </button>
          <button className="submitButton" type="button" onClick={() => navigate('/guest')}>
            Guest
          </button>
        </form>
      </div>
      <div className="loginError" role="alert">
        {serverError}
      </div>
    </div>
  );
};
