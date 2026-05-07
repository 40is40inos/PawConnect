const express = require( "express");
const cookieParser = require('cookie-parser');
const app = express();
const port = 5000;

// this is needed for the axios to work
var cors = require('cors');
app.use(cors({
  credentials: true,
  origin: "http://localhost:3000",
}));

var bodyParser = require('body-parser')
app.use(bodyParser.json() );        // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(cookieParser());

const { syncDB , forceSyncDB, initDB} = require('./models/index')

const { userController } = require('./controllers/userController')

// init db
initDB()
// forceSyncDB()


app.post('/',async (req, res) => {
  console.log(req.cookies);
  if(req.cookies.user) { // if we have a cookie
      if(req.cookies.user.isAdmin) return res.status(201).send({redirect : 'admin'}); // if he is admin return admin
      
      req.params.username = req.cookies.user.userName; // give him the username
      return await userController.getUser(req, res); // get the user
  }
  else return res.status(200).send({redirect : 'login'});
});

app.post('/login', (req, res) => {  // called by login.jsx threw API
  userController.login(req, res);   // call login from contoller, give him vars (username and password)
});

app.post('/register', (req, res) => {   // called by register.jsx threw API
  userController.register(req, res);    // call register from contoller, give him vars (username and password)
});

app.get('/usersForAdmin/getAll', (req, res) => {
    userController.getAll(req, res);
});

app.get('/users/getPetOwners', (req, res) => {
    userController.getPetOwner(req, res);
} );

app.get('/users/getPetKeepers', (req, res) => {
    userController.getPetKeeper(req, res);
} );

app.post('/users/update/:username', (req, res) => {
    userController.updateUser(req, res);
});

app.delete('/usersForAdmin/:username', (req, res) => {
    userController.deleteUser(req, res);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




