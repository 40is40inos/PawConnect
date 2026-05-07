import React, { useState, useEffect } from 'react';
import { deleteUser , getAllUser } from '../../api/usersForAdmin';
import { DisplayUsers } from "../../components/displayUsers/displayUsers";
import { useNavigate  } from "react-router-dom";

import './admin.css'


const Admin = () => {
    const [users, setUsers] = useState([]);
    const [showUsers, setShowUsers] = useState(false);
    const navigate = useNavigate();

    // what if the admin presses the user card
    const onUserClick = (user) => {
        // delete the user
        deleteUser(user.userName).then(() => {
            // then get all the users again
            getAllUser().then((res) => {
                // give each user object a delete function
                res.forEach((user) => {user.onClick = () => {onUserClick(user)}})
                setUsers(res);
            });
        });
    }

    useEffect(() => {
        getAllUser().then((res) => {
            // give each user object a delete function
            res.forEach((user) => {user.onClick = () => {onUserClick(user)}})
            setUsers(res);
        });
    }, []);

    useEffect(() => {
        if(users.length === 0) return;
        console.log(users);
    }, [users]);

    const showUserButton = (
        <button
            onClick={() => {
                setShowUsers(old => !old);
                
            }}
        >
            {!showUsers ? 'show users' : 'close users'}
        </button>
    );

    const _logout = (e) => {
        document.cookie = 'user'+'=; Max-Age=-99999999;';
        navigate('/login')
    }
    const logoutButton = <button onClick={_logout}>logout</button>

    return (
        <div className="adminPage">
            <h1>Admin Page</h1>
            <div className='buttons'>
                {logoutButton}
                {showUserButton}
            </div>
           {showUsers && <>ON CLICK YOU DELETE A USER<DisplayUsers users={users} showType={true}/></>}
        </div>
    );
    
};



export default Admin;
