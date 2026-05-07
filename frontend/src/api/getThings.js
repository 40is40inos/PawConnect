import axios from 'axios';

export const getPetKeeper = async () => {     // called by login page on submit
    const response =  await axios.get('http://localhost:5000/users/getPetKeepers');
    return response.data;
}

export const getPetOwner = async () => {     // called by login page on submit
    const response =  await axios.get('http://localhost:5000/users/getPetOwners');
    return response.data;
}