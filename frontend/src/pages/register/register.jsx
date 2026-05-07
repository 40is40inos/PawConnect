import { tryRegister } from '../../api/login';
import { useNavigate  } from "react-router-dom";
import { useState } from 'react';

import './register.css'

export const Register = () => { 

    const navigate = useNavigate();
    const [serverError , setServerError] = useState(null);


    const _goToLogin = () => {
        navigate('/login')
    }

    const _onSubmit = (e) => {
        e.preventDefault();
        const {username, password, email, birthdate, firstName, lastName, sex, 
            type, country, city, address, phoneNumber} = e.target;
        tryRegister(
            {   userName: username.value , 
                password: password.value, 
                email: email.value, 
                birthdate: birthdate.value,
                firstName: firstName.value,
                lastName: lastName.value,
                sex: sex.value,
                type: type.value, 
                country: country.value,
                city: city.value,
                address: address.value,
                phoneNumber: phoneNumber.value
            }
        ).then(_ => {
            navigate('/')
        }).catch(err =>{ console.log(err); setServerError(err.response.data)})

    }

    const _form = (
        <form onSubmit={_onSubmit}>
            <label>Username:
                <input name="username"  type="text" required/>
            </label>
            <label>Password:
                <input name="password"  type="password" required/>
            </label>
            <label>Email:
                <input name="email"  type="text" required/>
            </label>
            <label>Birthdate:
                <input name="birthdate"  type="date" required/>
            </label>
            <label>First name:
                <input name="firstName"  type="text" required/>
            </label>
            <label>Last name:
                <input name="lastName"  type="text" required/>
            </label>
            <label>Sex:
                <select id='sex' name='sex' size={1} required>
                    <option value='F'>Female</option>
                    <option value='M'>Male</option>
                    <option value='O'>Other</option>
                </select>
            </label>
            <label>Account type:
                <select id='type' name='type' size={1} required>
                    <option value='PETKEEPER'>Pet keeper</option>
                    <option value='PETOWNER'>Pet owner</option>
                </select>
            </label>
            <label>Country:
                <input name="country"  type="text" required/>
            </label>
            <label>City:
                <input name="city"  type="text" required/>
            </label>
            <label>Address:
                <input name="address"  type="text" required />
            </label>
            <label>Phone number:
                <input name="phoneNumber"  type="number" required/>
            </label>
            
            <div className='buttons'>
                <button className='submitButton' type="submit">Register</button>
                <button className='submitButton' type="button" onClick={_goToLogin}>Login</button>
                <button className='submitButton' type="button" onClick={()=>navigate('/guest')}>Guest</button>
            </div>
        </form>
    )



    return (<div className="loginBody">    
    <div className="loginTitle">Register</div>
    <div className="registerForm"> {_form} </div>
    <div className="loginError"> {serverError} </div>
    
</div>)
}