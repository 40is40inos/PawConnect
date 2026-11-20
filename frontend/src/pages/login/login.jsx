import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimate, useIsPresent, useReducedMotion } from 'motion/react';
import { login } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { useSession } from '../../session';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FloatField, PasswordField, Spinner } from '../../components/auth/fields';
import { photos } from '../landing/photos';

const homeFor = (profile) => (profile.role === 'ADMIN' ? '/admin' : '/');

export const Login = () => {
  const navigate = useNavigate();
  const { me, setMe } = useSession();
  const isPresent = useIsPresent();
  const reduce = useReducedMotion();
  const [scope, animate] = useAnimate();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in: go home (but not while this page is animating out
  // after a successful login, which navigates by itself).
  if (me && isPresent && !submitting) return <Navigate to={homeFor(me)} replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    const { username, password } = e.target;
    setSubmitting(true);
    setServerError(null);

    login(username.value, password.value)
      .then((profile) => {
        setMe(profile);
        navigate(homeFor(profile));
      })
      .catch((err) => {
        setServerError(errorMessage(err));
        setSubmitting(false);
        if (!reduce) animate(scope.current, { x: [0, -13, 11, -8, 5, 0] }, { duration: 0.42 });
      });
  };

  return (
    <AuthLayout
      photo={photos.heroOwnerGolden}
      chips={['Trusted local keepers', 'Reviews from real owners']}
      caption={
        <>
          Care that feels like <em>home</em>, while you’re away.
        </>
      }
    >
      <div className="authCard">
        <h1 className="authTitle">Welcome back</h1>
        <p className="authLead">Log in to see your pets, requests and bookings.</p>

        <form className="authForm" onSubmit={onSubmit} ref={scope}>
          <FloatField label="Username" name="username" autoComplete="username" required />
          <PasswordField label="Password" name="password" autoComplete="current-password" required />

          <AnimatePresence>
            {serverError && (
              <motion.p
                className="authError"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {serverError}
              </motion.p>
            )}
          </AnimatePresence>

          <button className="btn authSubmit" type="submit" disabled={submitting}>
            {submitting && <Spinner />} Log in
          </button>
        </form>

        <div className="authAlt">
          <p>
            New to PawConnect? <Link to="/register">Create an account</Link>
          </p>
          <p>
            <Link to="/guest">Browse keepers without an account</Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
