const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/users')



const router = express.Router()



router.get('/', (req, res, next) => {
    res.render('login')
})

router.post('/', async (req, res, next) => {
    const payLoad = req.body
    if (req.body.logUserName && req.body.logPassword) {
        const user = await User.findOne({
            $or: [{ userName: req.body.logUserName },
            { email: req.body.logUserName }]
        }).catch((e) => {
            console.log(e)
            payLoad.errorMessage = 'some thing went wrong'
           return res.status(200).render('register', payLoad)
        })

        if (user !== null) {
            const result = await bcrypt.compare(req.body.logPassword, user.password)
            if (result === true) {
                req.session.user = user
               return res.redirect('/')
            } else {
                payLoad.errorMessage = 'Incorrect Password'
               return res.status(200).render('login', payLoad)
            }
        }

        payLoad.errorMessage = 'Incorrect login credentials'
       return res.status(200).render('login', payLoad)

    }

    res.status(200).render('login')
})

module.exports = router