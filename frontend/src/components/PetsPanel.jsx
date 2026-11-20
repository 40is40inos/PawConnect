import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { createPet, deletePet, updatePet } from '../api/market';
import { errorMessage } from '../api/client';
import { SPECIES, SPECIES_LABELS } from '../utils/format';
import { hueFor } from '../utils/avatar';
import { EASE_OUT } from '../motion/kit';
import './marketplace.css';
import './dashboard.css';

const appear = {
  initial: { opacity: 0, y: 21, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const toNumberOrNull = (value) => (value === '' ? null : Number(value));
const toTextOrNull = (value) => value.trim() || null;

const PetForm = ({ pet, onSaved, onCancel }) => {
  const [error, setError] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const data = {
      name: f.name.value.trim(),
      species: f.species.value,
      breed: toTextOrNull(f.breed.value),
      birthYear: toNumberOrNull(f.birthYear.value),
      weightKg: toNumberOrNull(f.weightKg.value),
      careNotes: toTextOrNull(f.careNotes.value),
    };
    setError(null);
    (pet ? updatePet(pet.id, data) : createPet(data))
      .then(onSaved)
      .catch((err) => setError(errorMessage(err)));
  };

  return (
    <motion.form
      className="card form petForm"
      onSubmit={onSubmit}
      layout="position"
      {...appear}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      <h3 className="cardTitle">{pet ? `Edit ${pet.name}` : 'Add a pet'}</h3>
      <div className="formRow">
        <label className="field">
          Name
          <input name="name" defaultValue={pet?.name} maxLength={40} required />
        </label>
        <label className="field">
          Species
          <select name="species" defaultValue={pet?.species ?? 'DOG'}>
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {SPECIES_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Breed
          <input name="breed" defaultValue={pet?.breed ?? ''} maxLength={60} />
        </label>
      </div>
      <div className="formRow">
        <label className="field">
          Year of birth
          <input
            name="birthYear"
            type="number"
            min="1980"
            max={new Date().getFullYear()}
            defaultValue={pet?.birthYear ?? ''}
          />
        </label>
        <label className="field">
          Weight (kg)
          <input name="weightKg" type="number" min="0.01" step="0.01" max="200" defaultValue={pet?.weightKg ?? ''} />
        </label>
      </div>
      <label className="field">
        Care notes for keepers
        <textarea
          name="careNotes"
          maxLength={1000}
          defaultValue={pet?.careNotes ?? ''}
          placeholder="Food, medication, walks, habits…"
        />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button className="btn" type="submit">
          Save
        </button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </motion.form>
  );
};

export const PetsPanel = ({ pets, onChange }) => {
  const [editing, setEditing] = useState(null); // a pet, 'new' or null
  const [error, setError] = useState(null);

  const onDelete = (pet) => {
    if (!window.confirm(`Remove ${pet.name}?`)) return;
    setError(null);
    deletePet(pet.id)
      .then(onChange)
      .catch((err) => setError(errorMessage(err)));
  };

  const saved = () => {
    setEditing(null);
    onChange();
  };

  return (
    <section className="panel">
      <div className="cardHeader">
        <h2 className="panelTitle">My pets</h2>
        {!editing && (
          <button className="btn" onClick={() => setEditing('new')}>
            Add a pet
          </button>
        )}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <AnimatePresence initial={false}>
        {editing === 'new' && <PetForm key="new" onSaved={saved} onCancel={() => setEditing(null)} />}
      </AnimatePresence>
      {pets.length === 0 && editing !== 'new' && (
        <div className="empty">You haven't added any pets yet. Add one to start booking keepers.</div>
      )}
      <div className="cardGrid">
        <AnimatePresence>
          {pets.map((pet, i) =>
            editing?.id === pet.id ? (
              <PetForm key={`edit-${pet.id}`} pet={pet} onSaved={saved} onCancel={() => setEditing(null)} />
            ) : (
              <motion.div
                className="card petCard"
                key={`pet-${pet.id}`}
                layout="position"
                style={{ '--hue': hueFor(pet.name) }}
                {...appear}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: Math.min(i, 6) * 0.06 }}
              >
                <div className="petTop">
                  <span className="petBadge" aria-hidden="true">
                    {pet.name[0]}
                  </span>
                  <h3 className="cardTitle">{pet.name}</h3>
                  <span className="chip">{SPECIES_LABELS[pet.species]}</span>
                </div>
                <dl className="details">
                  {pet.breed && (
                    <>
                      <dt>Breed</dt>
                      <dd>{pet.breed}</dd>
                    </>
                  )}
                  {pet.birthYear && (
                    <>
                      <dt>Born</dt>
                      <dd>{pet.birthYear}</dd>
                    </>
                  )}
                  {pet.weightKg && (
                    <>
                      <dt>Weight</dt>
                      <dd>{pet.weightKg} kg</dd>
                    </>
                  )}
                </dl>
                {pet.careNotes && <p className="quote">{pet.careNotes}</p>}
                <div className="actions">
                  <button className="btn btn-secondary" onClick={() => setEditing(pet)}>
                    Edit
                  </button>
                  <button className="btn btn-secondary" onClick={() => onDelete(pet)}>
                    Remove
                  </button>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
