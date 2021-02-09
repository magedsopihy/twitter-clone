const express = require('express')
const route = express.Router()

route.get('/:id',(req,res,next)=>{
    
    const payLoad = {
        title: 'View Post',
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        postId: req.params.id,
    }
    res.status(200).render('postPage', payLoad)
})

module.exports = route