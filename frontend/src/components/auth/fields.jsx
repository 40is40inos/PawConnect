// Form fields whose label sits inside the box and floats up once you focus
// it or type. Selects and date inputs keep the label up, since they always
// show a value.
import { useId, useState } from 'react';
import { motion } from 'motion/react';

export function FloatField({ label, className = '', type = 'text', ...inputProps }) {
  const pinned = type === 'date';
  return (
    <label className={`floatField ${pinned ? 'isPinned' : ''} ${className}`}>
      <input type={type} placeholder=" " {...inputProps} />
      <span className="floatLabel">{label}</span>
    </label>
  );
}

export function FloatSelect({ label, className = '', children, ...selectProps }) {
  return (
    <label className={`floatField isPinned isSelect ${className}`}>
      <select {...selectProps}>{children}</select>
      <span className="floatLabel">{label}</span>
    </label>
  );
}

// Rough strength from length and character variety, 0 to 4.
function strength(value) {
  if (!value) return 0;
  let score = value.length >= 8 ? 1 : 0;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.max(score, value.length >= 4 ? 1 : 0);
}
const STRENGTH = ['', 'Weak', 'Okay', 'Good', 'Strong'];

// Password with a show/hide toggle and, optionally, a strength meter.
export function PasswordField({ label, meter = false, className = '', ...inputProps }) {
  const [shown, setShown] = useState(false);
  const [value, setValue] = useState('');
  const meterId = useId();
  const score = strength(value);

  return (
    <div className={`passwordField ${className}`}>
      <label className="floatField">
        <input
          type={shown ? 'text' : 'password'}
          placeholder=" "
          aria-describedby={meter ? meterId : undefined}
          {...inputProps}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="floatLabel">{label}</span>
      </label>
      {/* "Show"/"Hide" rather than "Show password", so the field's label stays unique. */}
      <button
        type="button"
        className="revealButton"
        aria-pressed={shown}
        onClick={() => setShown((s) => !s)}
      >
        {shown ? 'Hide' : 'Show'}
      </button>
      {meter && (
        <div className="strength" id={meterId} aria-live="polite">
          <div className="strengthBar">
            {[1, 2, 3, 4].map((n) => (
              <span className="strengthTrack" key={n}>
                <motion.span
                  className={`strengthStep s${score}`}
                  initial={false}
                  animate={{ scaleX: n <= score ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, delay: n <= score ? (n - 1) * 0.04 : 0 }}
                />
              </span>
            ))}
          </div>
          <span className="strengthText">{value ? STRENGTH[score] : 'At least 8 characters'}</span>
        </div>
      )}
    </div>
  );
}

export const Spinner = () => <span className="spinner" aria-hidden="true" />;
