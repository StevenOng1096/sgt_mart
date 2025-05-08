const express = require('express');
const session = require('express-session');
// const path = require('path');

const app = express();
const PORT = 3000;
const routes = require('./routes/index');

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended:true}))

// Set up session
app.use(session({
  secret: 'simple-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));


app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});