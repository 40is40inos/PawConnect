const { User } = require('./user')
const { Admin } = require('./admin')

// This creates the table if it doesn't exist (and does nothing if it already exists)
const initDB = () => {
    Admin.sync()
    User.sync()
}

// this can only alter if the tables don't have records
const syncDB = () => {
    Admin.sync({alter : true})
    User.sync({alter : true})
}

// this syncs by force , deleting all records
const forceSyncDB = async () => {

    await Admin.sync({ force: true })
    await User.sync({ force: true });  
    await User.create({userName: 'admin', password: 'admin'});

}

module.exports = { syncDB , forceSyncDB, initDB}