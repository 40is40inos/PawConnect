import './displayUsers.css';

const SEX_LABELS = { F: 'Female', M: 'Male', O: 'Other' };
const TYPE_LABELS = { PETKEEPER: 'Pet keeper', PETOWNER: 'Pet owner' };

// The API returns different fields depending on who is asking (guests get no
// contact details), so every row is shown only when the field is present.
const Info = ({ label, value }) =>
  value ? (
    <div className="subInfo">
      <div className="text">{label}:</div>
      <div className="value">{value}</div>
    </div>
  ) : null;

export const DisplayUsers = ({ users, showType = false, onDelete }) => {
  if (!users?.length) {
    return (
      <div className="displayUsers">
        <div className="noUsers">No users</div>
      </div>
    );
  }

  return (
    <div className="displayUsers">
      {users.map((user) => (
        <div className="user" key={user.userName}>
          <div className="userName">
            {user.firstName} {user.lastName}
          </div>

          <div className="categoryTitle">Information</div>
          <Info label="User name" value={user.userName} />
          <Info label="Telephone" value={user.phoneNumber} />
          <Info label="Email" value={user.email} />
          <Info label="Birth date" value={user.birthdate} />
          <Info label="Sex" value={SEX_LABELS[user.sex]} />

          <div className="categoryTitle">Location</div>
          <Info label="Address" value={user.address} />
          <Info label="City" value={user.city} />
          <Info label="Country" value={user.country} />

          {showType && <Info label="Type" value={TYPE_LABELS[user.type]} />}

          {onDelete && (
            <button className="linkButton" type="button" onClick={() => onDelete(user)}>
              Delete user
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// links = [{ link, title, text }]
export const DisplayLinks = ({ links }) => (
  <div className="displayUsers">
    {links.map((link) => (
      <div className="user" key={link.link}>
        <div className="userName">{link.title}</div>
        <a className="linkButton" href={link.link} target="_blank" rel="noopener noreferrer">
          {link.text}
        </a>
      </div>
    ))}
  </div>
);
