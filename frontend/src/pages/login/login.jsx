import { useState } from 'react';
import { tryLogin } from '../../api/login';
import { useNavigate  } from "react-router-dom";

import './login.css'

export const Login = () => {
    const navigate = useNavigate();
    const [serverError , setServerError] = useState(null);

    const _onSubmit = (e) => {
        e.preventDefault();
        const {username, password} = e.target;
        console.log(username.value , password.value);

        tryLogin(username.value , password.value)   // Call API's tryLogin
            .then(_ => { navigate('/') }).catch(err =>{ console.log(err); setServerError(err.response.data)})
    }

    const _goToRegister = () => {
        navigate('/register')
    }

    const _goToAdmin = () => {
        navigate('/admin')
    }

    const _form = (
        <form onSubmit={_onSubmit}>
            <label>Username:
                <input name="username"  type="text" required/>
            </label>
            <label>Password:
                <input name="password"  type="password" required/>
            </label>
            <button className='submitButton' type="submit">Login</button>
            <button className='submitButton' type="button" onClick={_goToRegister}>Register</button>
            <button className='submitButton' type="button" onClick={()=>navigate('/guest')}>Guest</button>
        </form>
    )

    return (<div className="loginBody">    
        <div className="loginTitle">Login</div>
        <div className="loginForm"> {_form} </div>
        <div className="loginError"> {serverError} </div>
        
    </div>)
}