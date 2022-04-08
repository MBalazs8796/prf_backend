const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const stockSchema = require('./stock.schema');

const userSchema = new mongoose.Schema({
    username: {type: String, required: true}, 
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    isAdmin: {type: Boolean, required: false, default: false},
    orders: [stockSchema]
},{collection: 'users'});

userSchema.pre('save', function(next){
    const user = this
    if(this.isModified('password')){
        bcrypt.genSalt(11, function(err, salt){
            if(err){
                console.log("Error during salt generation!");
                return next(error);
            }
            bcrypt.hash(user.password, salt, function(error, hash){
                if(error){
                    console.log("Error during hashing!");
                    return next(error);
                }
                user.password = hash;
                return next();
            })
        })
    } else{
        return next();
    }

});

userSchema.methods.comparePasswords = function(password, next){
    bcrypt.compare(password, this.password, function(err, isMatch){
        next(err, isMatch);
    })
};

module.exports = userSchema