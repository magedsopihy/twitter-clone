const express = require('express')
const User = require('../models/users')
const route = express.Router()

route.get('/', (req, res, next) => {

    const payLoad = {
        title: req.session.user.userName,
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
        profileUser: req.session.user,
    }
    res.status(200).render('profilePage', payLoad)
})

route.get('/:username', async(req, res, next) => {

   const payLoad = await getPayLoad(req.params.username , req.session.user)
   res.status(200).render('profilePage', payLoad)
})

route.get('/:username/replies', async(req, res, next) => {

    let payLoad = await getPayLoad(req.params.username , req.session.user)
    payLoad.selectedTab = "replies"

    res.status(200).render('profilePage', payLoad)
 })

 //followers route 
 route.get('/:username/followers', async(req, res, next) => {

    let payLoad = await getPayLoad(req.params.username , req.session.user)
    payLoad.selectedTab = "followers"

    res.status(200).render('followersAndFollowing', payLoad)
 })

  //following route 
  route.get('/:username/following', async(req, res, next) => {

    let payLoad = await getPayLoad(req.params.username , req.session.user)
    payLoad.selectedTab = "following"

    res.status(200).render('followersAndFollowing', payLoad)
 })
async function getPayLoad(username, userLoggedIn) {
    let user = await User.findOne({ userName: username })

    //check for null 
    if (user == null) {
        user = await User.findById(username)
        if(user == null){
            return {
                title: 'user not found',
                userLoggedIn: userLoggedIn,
                userLoggedInJs: JSON.stringify(userLoggedIn),
            }
        }
    }
    return {
        title: user.userName,
        userLoggedIn: userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn),
        profileUser: user,
    }
}

module.exports = route