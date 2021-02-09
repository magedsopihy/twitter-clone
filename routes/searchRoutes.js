const express = require('express')
const router = express.Router()


router.get('/',(req,res)=>{
    const userloggedIn = req.session.user
    const payload = getPayLoad(userloggedIn)
    res.render('searchPage',payload)
})

router.get('/:selectedTab',(req,res)=>{
    const userLoggedIn = req.session.user

    let payload = getPayLoad(userLoggedIn)
    payload.selectedTab = req.params.selectedTab
    
    
    res.render('searchPage',payload)
})


function getPayLoad(userLoggedIn){

    return{
        title: 'Search',
        userLoggedIn : userLoggedIn,
        userLoggedInJs: JSON.stringify(userLoggedIn)
    }

}

module.exports  = router
