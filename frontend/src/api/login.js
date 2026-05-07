import axios from 'axios';


export const tryLogin = async (username, password) => {     // called by login page on submit
    const response =  await axios.post('http://localhost:5000/login', {username, password}, {withCredentials: true});
    return response.data;
}

export const tryRegister = async (data) => {
    const response =  await axios.post('http://localhost:5000/register', data,{ withCredentials: true});
    return response.data;
}

export const tryMainPage = async () => {
    const response =  await axios.post('http://localhost:5000/',{},{ withCredentials: true});
    return response.data;
}

export const updateUser = async (username,data) => {
    const response =  await axios.post('http://localhost:5000/users/update/'+username, data,{ withCredentials: true});
    return response.data;
}