import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUser, getAllUsers } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { DisplayUsers } from '../../components/displayUsers/displayUsers';
import { useSession } from '../../session';
import '../../components/marketplace.css';

// The server enforces admin access on every request; this check only decides
// what to render.
const Admin = () => {
  const navigate = useNavigate();
  const { me } = useSession();
  const admin = me?.role === 'ADMIN' ? me : null;
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [error, setError] = useState(null);

  const loadUsers = useCallback(
    () =>
      getAllUsers()
        .then(setUsers)
        .catch((err) => setError(errorMessage(err))),
    []
  );

  useEffect(() => {
    if (me === undefined) return; // session still loading
    if (!admin) navigate('/login');
    else loadUsers();
  }, [me, admin, navigate, loadUsers]);

  const onDelete = (user) => {
    if (!window.confirm(`Delete ${user.userName}? This cannot be undone.`)) return;
    deleteUser(user.userName)
      .then(loadUsers)
      .catch((err) => setError(errorMessage(err)));
  };

  if (!admin) return null;

  return (
    <div className="dashboard">
      <header className="dashboardHeader">
        <div>
          <h1 className="dashboardTitle">Admin page</h1>
          <span className="cardMeta">
            {users.length} {users.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowUsers((old) => !old)}>
          {showUsers ? 'Close users' : 'Show users'}
        </button>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {showUsers && (
        <section className="panel">
          <DisplayUsers users={users} showType onDelete={onDelete} />
        </section>
      )}
    </div>
  );
};

export default Admin;
