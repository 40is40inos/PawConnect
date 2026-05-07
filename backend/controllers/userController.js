// request from model threw Service, take results from Service
const { userService } = require('../services/userService')

const userController = {};

userController.getAll = async (req, res)=> {    
    const allUsers = await userService.getAll();
    
    return res.status(200).send(allUsers);
}

userController.deleteUser = async (req, res) => {
    const { username } = req.params; // Extract username from request parameters

    try {
        const result = await userService.deleteUser(username); // Call deleteUser method of userService
        if (result > 0) {
            res.status(200).send({ message: 'User successfully deleted' });
        } else {
            res.status(404).send({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Error deleting user', error: error.message });
    }
};


userController.createUser = async (firstName , lastName) => {
    return await User.create({firstName,lastName});
}

userController.register = async (req, res) => {
    // make checks
    if(await userService.checkUsername(req.body.userName)) return res.status(400).send('Username already exists');    // if username exists return error
    if(await userService.checkEmail(req.body.email)) return res.status(400).send('Email already exists');    // if email exists return error

    const user = await userService.register(req.body); // give to service to register
    if(!user) return res.status(400).send('Couldn\'t register ');    // if it coudnt register return error
    else{
        res.cookie('user', {password: user.dataValues.password, userName : user.dataValues.userName }, { maxAge : 60 * 60 * 1000});    
        return res.status(200).send(user);   // else return user
    }
}

userController.getUser = async (req, res) => {
    const { username } = req.params; // Extract username from request parameters
    return res.status(200).send(await userService.getUser(username));
}


userController.login = async (req, res) => {
    console.log(req.cookies);
    if(req.cookies.user) return res.status(400).send('Already logged in');    // if already logged in return error
    const {username, password} = req.body;                      // take vars from server (from front)

    // if(username === 'admin' && password === 'admin12'){
    //     return res.status(201);   // 201 status for isAdmin
    // }

    const user = await userService.login(username, password);   // give to service to check if they match
    const admin = await userService.loginAdmin(username, password);

    if(admin) {
        res.cookie('user', {isAdmin: true ,password: admin.dataValues.password, userName : admin.dataValues.userName }, { maxAge : 60 * 60 * 1000});    
        return res.status(200).send(admin); 
    }
    
    if(!user) return res.status(400).send('Wrong username or password');    // they dont match
    else{
        console.log('here');
        res.cookie('user', {password: user.dataValues.password, userName : user.dataValues.userName }, { maxAge : 60 * 60 * 1000});    
        return res.status(200).send(user);   // else return user
    }                               // they match
}

userController.getPetKeeper = async (req , res) => {
    return res.status(200).send(await userService.getPetKeeper());
}

userController.getPetOwner = async (req , res) => {
    return res.status(200).send(await userService.getPetOwner());
}

userController.updateUser = async (req, res) => {
    const { username } = req.params; // Extract username from request parameters
    return res.status(200).send(await userService.updateUser(username,req.body));

}

module.exports = {userController}
