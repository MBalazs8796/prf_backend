const router = require('express').Router()

const mongoose = require('mongoose')
const stockModel = mongoose.model('stock')
const userModel = mongoose.model('user')

router.route('/purchase/:id?').post((req,res)=>{
    if(!req.isAuthenticated()){
        return res.status(403).send('Action only available to registered users!')
    }

    if(!req.body.amount){
        return res.status(400).send('Bad request, purchased amount needed!');
    } else if(isNaN(req.body.amount)){
        return res.status(400).send('Bad request, purchased amount must be a number!');
    }

    stockModel.findOne({ name: req.params.id }, (err, aru) => {
        if (err) return res.status(500).send('DB error ' + err)
        if (!aru) return res.status(404).send('Item does not exist!')
        if(aru.amount < req.body.amount) return res.status(400).send('Not enough ' +aru.name+ ' in sock!')
        aru.amount -= req.body.amount;
        aru.save((error) => {
            if (error) return res.status(500).send('DB error during stock update ' + error)
            userModel.findOne({ email: req.user.email}, (err, user) =>{
                user.orders.push(
                    new stockModel({
                        name : aru.name,
                        cost : aru.cost,
                        amount : req.body.amount
                    })
                );
                user.save((error)=>{
                    if (error) return res.status(500).send('DB error during previous purchase update ' + error)
                    return res.status(200).send('Purchase successfull!')
                })
            })
        })
    })
})

router.route('/:id?').get((req, res) => {
    if(!req.isAuthenticated()){
        return res.status(403).send('Action only available to registered users!')
    }
    if (!req.params.id) {
        stockModel.find((err, aruk) => {
            if (err) return res.status(500).send('DB error ' + err)
            return res.status(200).send(aruk)
        })
    } else {
        stockModel.findOne({ name: req.params.id }, (err, aru) => {
            if (err) return res.status(500).send('DB error ' + err)
            if (!aru) return res.status(404).send('Item does not exist!')
            return res.status(200).send(aru)
        })
    }
}).post((req, res) => {
    if(!req.isAuthenticated() || !req.user.isAdmin){
        return res.status(403).send('Action only available to admins!')
    }
    if (!req.params.id || !req.body.cost) {
        return res.status(400).send("Missing input!")
    } else {
        const nItem = new stockModel({
            name: req.params.id,
            cost: req.body.cost
        })
        if(req.body.amount){
            nItem.amount = req.body.amount
        }
        nItem.save((error) => {
            if (error) return res.status(500).send('DB error during save ' + error)
            return res.status(200).send(req.body)
        })

    }
}).put((req, res) => {
    if(!req.isAuthenticated() || !req.user.isAdmin){
        return res.status(403).send('Action only available to admins!')
    }
    if (!req.params.id || (!req.body.cost && !req.body.amount)) {
        return res.status(400).send("Missing input!")
    } else {
        stockModel.findOne({ name: req.params.id }, (err, aru) => {
            if (err) return res.status(500).send('DB error ' + err)
            if (!aru) return res.status(400).send('Item does not exist yet!')
            if (req.body.cost) aru.cost = req.body.cost
            if (req.body.amount) aru.amount = req.body.amount
            aru.save((error) => {
                if (error) return res.status(500).send('DB error during save ' + error)
                return res.status(200).send(aru)
            })
        })
    }
}).delete((req, res) => {
    if(!req.isAuthenticated() || !req.user.isAdmin){
        return res.status(403).send('Action only available to admins!')
    }
    if (!req.params.id) {
        stockModel.deleteMany((err) => {
            if (err) return res.status(500).send('DB hiba ' + err)
            return res.status(200).send('Deleted everything')
        })
    } else {
        stockModel.findOne({nev: req.params.id}, (err, aru) => {
            if(err) return res.status(500).send('DB error ' + err)
            if(!aru) return res.status(400).send('Item does not exist!')
            aru.delete((error) => { 
                if(error) return res.status(500).send('DB error during deletion' + err)
                else return res.status(200).send('Item deleted!')
             })
        })
         
    }
})


module.exports = router