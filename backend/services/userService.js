// This is the Service layer taking requests from controller and giving results from the model

// get table from model (exported with module.exports = { User })
const { User } = require('../models/user')
const { Admin } = require('../models/admin')


const userService = {};

userService.getAll = async () => {
    return await User.findAll()
}

userService.createUser = async (firstName , lastName) => {
    return await User.create({firstName,lastName});
}

userService.delete = async (id) => {
    return await User.destroy({id});
}

userService.login = async (username, password) => {
    return await User.findOne({where: {username, password}});   // check if they exists and match
}

userService.register = async (data) => {
    return await User.create(data);                     // 
}

userService.checkUsername = async (username) => {
    return await User.findOne({where: {username}});     // check if already existing username
}

userService.checkEmail = async (email) => {
    return await User.findOne({where: {email}});        // check if already existing email
}

userService.deleteUser = async (username) => {
    return await User.destroy({ where: { username }});  // delete user by username given from controller
}

userService.getUser = async (username) => {
    return await User.findOne({ where: { username }});  // get user by username given from controller
}

userService.getPetKeeper = async () => {
    return await User.findAll({ where: { type:'PETKEEPER' } ,attributes: {exclude: ['password']}});  // get all pet keepers
}

userService.getPetOwner = async () => {
    return await User.findAll({ where: { type:'PETOWNER' }, attributes: {exclude: ['password']}});  // get all pet owners
}

userService.loginAdmin = async (username , password) => {
    return await Admin.findOne({ where: { username , password }});
}

userService.updateUser = async (username , data) => {
    const user = await User.findOne({ where: { username }});
    if(!user) return null;
    user.update(data);
    await user.save();
    return user;
}

// give table to 
module.exports = {userService}