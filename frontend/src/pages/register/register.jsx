import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { register } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { useSession } from '../../session';
import { EASE_OUT } from '../../motion/kit';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { FloatField, FloatSelect, PasswordField, Spinner } from '../../components/auth/fields';
import { photos } from '../landing/photos';

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

// Each group of fields rises in a little after the one before.
const group = (i) => ({
  initial: { opacity: 0, y: 21 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE_OUT, delay: 0.25 + i * 0.1 },
});

export const Register = () => {
  const navigate = useNavigate();
  const { me, setMe } = useSession();
  const isPresent = useIsPresent();
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (me && isPresent && !submitting) return <Navigate to="/" replace />;

  const onSubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(FIELDS.map((f) => [f, e.target[f].value]));
    setSubmitting(true);
    setServerError(null);

    register(data)
      .then((profile) => {
        setMe(profile);
        navigate('/');
      })
      .catch((err) => {
        setServerError(errorMessage(err));
        setSubmitting(false);
      });
  };

  return (
    <AuthLayout
      photo={photos.parkWalk}
      photoPosition="28% 78%"
      wideForm
      chips={['Free to join', 'Owners and keepers']}
      caption={
        <>
          Find someone your pet will <em>love</em>, or become that someone.
        </>
      }
    >
      <div className="authCard">
        <h1 className="authTitle">Create your account</h1>
        <p className="authLead">
          Already have one? <Link to="/login">Log in</Link>
        </p>

        <form className="authForm" onSubmit={onSubmit}>
          <motion.fieldset className="authGroup" {...group(0)}>
            <legend>Your account</legend>
            <FloatSelect label="Account type" name="type" required defaultValue="PETOWNER" className="spanAll">
              <option value="PETOWNER">Pet owner: I'm looking for a keeper</option>
              <option value="PETKEEPER">Pet keeper: I look after pets</option>
            </FloatSelect>
            <FloatField
              label="Username"
              name="userName"
              autoComplete="username"
              pattern="[A-Za-z0-9_]{3,30}"
              title="3-30 letters, digits or underscores"
              required
            />
            <FloatField label="Email" name="email" type="email" autoComplete="email" required />
            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              meter
              required
              className="spanAll"
            />
          </motion.fieldset>

          <motion.fieldset className="authGroup" {...group(1)}>
            <legend>About you</legend>
            <FloatField label="First name" name="firstName" autoComplete="given-name" required />
            <FloatField label="Last name" name="lastName" autoComplete="family-name" required />
            <FloatField label="Birthdate" name="birthdate" type="date" required />
            <FloatSelect label="Sex" name="sex" required>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="O">Other</option>
            </FloatSelect>
          </motion.fieldset>

          <motion.fieldset className="authGroup" {...group(2)}>
            <legend>Where you are</legend>
            <FloatField label="Country" name="country" autoComplete="country-name" required />
            <FloatField label="City" name="city" autoComplete="address-level2" required />
            <FloatField label="Address" name="address" autoComplete="street-address" className="spanAll" required />
            <FloatField
              label="Phone number"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              pattern="\+?[0-9]{7,15}"
              title="7-15 digits, optionally starting with +"
              className="spanAll"
              required
            />
          </motion.fieldset>

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

          <motion.button className="btn authSubmit" type="submit" disabled={submitting} {...group(3)}>
            {submitting && <Spinner />} Create account
          </motion.button>
        </form>

        <p className="authAlt">
          <Link to="/guest">Browse keepers first</Link>
        </p>
      </div>
    </AuthLayout>
  );
};
