const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    const PayLoad = {
        title: "Notifications",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }
    res.render('notifications', PayLoad)
})

module.exports = router