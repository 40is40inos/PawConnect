import { useState } from 'react';
import { saveKeeperProfile } from '../api/market';
import { errorMessage } from '../api/client';
import { SPECIES, SPECIES_LABELS } from '../utils/format';
import './marketplace.css';

export const KeeperProfileForm = ({ profile, onSaved }) => {
  const [species, setSpecies] = useState(profile?.acceptedSpecies ?? []);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const toggle = (s) =>
    setSpecies((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  const onSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    saveKeeperProfile({
      bio: e.target.bio.value.trim(),
      dailyRate: Number(e.target.dailyRate.value),
      acceptedSpecies: species,
    })
      .then((saved) => {
        setNotice('Saved. Owners can now find you in search.');
        onSaved(saved);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  return (
    <section className="panel">
      <h2 className="panelTitle">Keeper profile</h2>
      {!profile && (
        <div className="empty">Owners can't find you yet. Fill this in to appear in search.</div>
      )}
      <form className="card form" onSubmit={onSubmit}>
        <label className="field">
          About you
          <textarea
            name="bio"
            defaultValue={profile?.bio ?? ''}
            minLength={20}
            maxLength={1000}
            placeholder="Your experience with animals, your home, your availability…"
            required
          />
        </label>
        <div className="formRow">
          <label className="field">
            Price per day (€)
            <input
              name="dailyRate"
              type="number"
              min="1"
              max="500"
              step="0.01"
              defaultValue={profile?.dailyRate ?? ''}
              required
            />
          </label>
        </div>
        <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend>Pets you look after</legend>
          <div className="checkboxes">
            {SPECIES.map((s) => (
              <label key={s}>
                <input type="checkbox" checked={species.includes(s)} onChange={() => toggle(s)} />
                {SPECIES_LABELS[s]}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        {notice && <p className="success">{notice}</p>}
        <div className="actions">
          <button className="btn" type="submit" disabled={species.length === 0}>
            Save profile
          </button>
        </div>
      </form>
    </section>
  );
};
