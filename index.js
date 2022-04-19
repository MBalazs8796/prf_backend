const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser')

const session = require('express-session')
const localStrategy = require('passport-local').Strategy
const fs = require('fs');
const cors = require('cors');
const path = require('path');


const app = express();

const port = process.env.PORT || 3000;

const pw  = process.env.MONGOPW || fs.readFileSync('magic')

const dbUrl = 'mongodb+srv://mbalazs:'+pw+'@prfassignmentcluster.87a0w.mongodb.net/webshopDB?retryWrites=true&w=majority'
mongoose.connect(dbUrl)

mongoose.connection.on('connected', () => { console.log('db connected') })
mongoose.connection.on('error', (err) => { console.log('db error', err) })

mongoose.model('stock', require('./models/stock.schema'))
mongoose.model('user', require('./models/user.schema'))

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));



app.use(cors({origin: function(origin, callback){
    callback(null, true);
}, credentials: true, methods: "GET,PUT,POST,DELETE,OPTIONS"}))

passport.use('local', new localStrategy({usernameField: 'email'}, function (email, password, done) {
    const userModel = mongoose.model('user')
    userModel.findOne({ email: email }, function (err, user) {
        if (err) return done('Error during DB access', null);
        if (!user) return done('No user with provided email', null);
        user.comparePasswords(password, function (error, isMatch) {
            if (error) return  done(error, false);
            if (!isMatch) return done('Incorrect password', false);
            return done(null, user);
        })
    })
}));

passport.serializeUser(function (user, done) {
    if (!user) return done('nincs megadva beléptethető felhasználó', null);
    return done(null, user);
});
passport.deserializeUser(function (user, done) {
    if (!user) return done("nincs user akit kiléptethetnénk", null);
    return done(null, user);
});


app.use(session({ secret: 'shroomStoreFunnyNumber11', resave: true, cookie: { secure: false } }));
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public'))).set('views', path.join(__dirname, 'views')).set('view engine', 'ejs').get('/', (req, res) => res.render('pages/index'));

app.use('/users', require('./user_routes'));
app.use('/stock', require('./stock_routes'));
app.use('/' ,(req,res) =>{
    return res.status(404).send('Page not found!');
});
app.listen(port, () => {
    console.log('Server is up!');
});