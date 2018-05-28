const express = require('express'),
  session = require('express-session'),
  mongoose = require('mongoose'),
  path = require('path'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  passport = require('passport');

const app = express();
const config = require('./config/database');

mongoose.Promise = global.Promise;
mongoose.connect(config.uri, (err) => {
  if (err) {
    console.log('Could NOT connect to database: ', err);
  } else {
    console.log('Connected to database: ', config.db);
  }
});

// Require Paths
const auth = require('./routes/auth');
require('./config/passport');

app.use(cors({ origin: '*' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.use('/api', auth);

//Entrance to the website
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname + '/public/index.html'))
// });
app.get('*', (req, res) => {
  res.send('Catch all route');
})

app.listen(8080, () => {
  console.log('Server started on port 8080');
});
