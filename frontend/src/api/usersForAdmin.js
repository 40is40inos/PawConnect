import axios from 'axios';

export const getAllUser = async () => {
    const response =  await axios.get('http://localhost:5000/usersForAdmin/getAll');
    return response.data;
}

// function to delete a user
export const deleteUser = async (username) => {
    try {
        const response = await axios.delete(`http://localhost:5000/usersForAdmin/${username}`);
        return response.data; // or return a success message
    } catch (error) {
        // Handle or throw the error as needed
        console.error('Error deleting user:', error);
        throw error;
    }
};
