import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout } from '../../api/auth';
import { deleteUser, getAllUsers } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { DisplayUsers } from '../../components/displayUsers/displayUsers';

import './admin.css';

// The server enforces admin access on every request; this check only decides
// what to render.
const Admin = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
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
    getMe()
      .then((me) => {
        if (me?.role !== 'ADMIN') return navigate('/login');
        setAdmin(me);
        return loadUsers();
      })
      .catch((err) => setError(errorMessage(err)));
  }, [navigate, loadUsers]);

  const onDelete = (user) => {
    if (!window.confirm(`Delete ${user.userName}? This cannot be undone.`)) return;
    deleteUser(user.userName)
      .then(loadUsers)
      .catch((err) => setError(errorMessage(err)));
  };

  const onLogout = () => logout().finally(() => navigate('/login'));

  if (!admin) return error ? <div className="loginError">{error}</div> : null;

  return (
    <div className="adminPage">
      <h1>Admin Page</h1>
      <div className="buttons">
        <button onClick={onLogout}>Logout</button>
        <button onClick={() => setShowUsers((old) => !old)}>
          {showUsers ? 'Close users' : 'Show users'}
        </button>
      </div>
      {error && <div className="loginError">{error}</div>}
      {showUsers && <DisplayUsers users={users} showType onDelete={onDelete} />}
    </div>
  );
};

export default Admin;
