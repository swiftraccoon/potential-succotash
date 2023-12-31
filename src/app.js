const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();

const homeRoute = require('./routes/home');
const registrationRoute = require('./routes/registration');
const loginRoute = require('./routes/login');
const searchRoute = require('./routes/search');
const subscriptionRoute = require('./routes/subscription');

// MongoDB connection
const mongoDBUrl = 'mongodb://root:example@localhost:27017/mydatabase?authSource=admin';
mongoose.connect(mongoDBUrl)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session configuration
app.use(session({
    secret: 'your-secret-key', // Replace with a real secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Set to true if using HTTPS, which you are
  }));


// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', homeRoute);
app.use('/', searchRoute);
app.use('/', subscriptionRoute);
app.use('/auth', registrationRoute);
app.use('/auth', loginRoute);


// HTTPS options
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs/server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/server.cert'))
};

const server = https.createServer(options, app);
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('a user connected');
  // Implement real-time logic here
});

// Start HTTPS server on port 443
server.listen(443, () => {
  console.log('Server is now listening on https://localhost');
});
