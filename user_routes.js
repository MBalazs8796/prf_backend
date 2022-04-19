const router = require('express').Router()


const mongoose = require('mongoose')
const passport = require('passport')


const userModel = mongoose.model('user')

router.route('/admin').put((req, res) =>{
    if(!req.isAuthenticated() || !req.user.isAdmin){
        return res.status(403).send('Action only available to admins!')
    }

    if(!req.body.email || !req.body.password){
        return res.status(400).send('Bad request, email and password is needed to modify user!')
    }

    userModel.findOne({email : req.body.email}, (err, user)=>{
        if (err) return res.status(500).send('Error during DB access');
        if (!user) return res.status(404).send('No user with provided email');

        user.comparePasswords(req.body.password, function(error, isMatch){
            if (error) return res.status(500).send('Error during password check');
            if (!isMatch) return res.status(403).send('Incorrect password');

            if(req.body.newPassword){
                user.password = req.body.newPassword;
            }
            if(req.body.newUserName){
                user.username = req.body.newUserName;
            }
            user.save((error) => {
                if (error) return res.status(500).send('DB error during saving changes: ' + error)
                return res.status(200).send('User update succesful')
            })
        })
    });
}).delete((req, res) =>{
    if(!req.user.isAdmin){
        return res.status(401).send('Action only available to admins!')
    }

    if(!req.body.email){
        return res.status(400).send('Bad request, email is needed to identify user!')
    }

    userModel.deleteOne({email : req.body.email}, (err) =>{
        if(err){
            res.status(500).status('Error during removal: ' + err);
        } else{
            res.status(200).send('User removed')
        }
    })

    return res;
})

router.route('/login').post((req, res, next) => {
    if (req.body.email && req.body.password) {
        passport.authenticate('local', function (error, user) {
            if (error) return res.status(500).send(error);
            req.logIn(user, function (error) {
                if (error) return res.status(500).send(error);
                return res.status(200).send('Login success!');
            })
        })(req, res, next);
    } else { return res.status(400).send('Bad request, email and password needed!'); }
});

router.route('/logout').post((req, res) => {
    if (req.isAuthenticated()) {
        req.logout();
        return res.status(200).send('Logout success!');
    } else {
        return res.status(403).send('No user to log out!');
    }
})

router.route('/:id').get((req, res) => {
    userModel.find({ username: req.params.id }, (err, user) => {
        if (err) return res.status(500).send('DB hiba ' + err)
        if (!user) return res.status(400).send('No user with provided username!')
        return res.status(200).send(user)
    })
}).post((req, res) => {
    if (!req.params.id || !req.body.password || !req.body.email) {
        return res.status(400).send("Missing input!")
    } else {
        userModel.findOne({ email: req.body.email }, (err, user) => {
            if (err) return res.status(500).send('DB error: ' + err)
            if (user) return res.status(400).send('User already exists')
            const nUser = new userModel({
                username: req.params.id, 
                email: req.body.email,
                password: req.body.password
            })
            nUser.save((error) => {
                if (error) return res.status(500).send('Error loading DB: ' + error)
                return res.status(200).send(req.body)
            })
        })
    }
})

module.exports = router