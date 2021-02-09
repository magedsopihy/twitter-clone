const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/users')


const app = express()
const router = express.Router()


router.get('/', (req, res, next) => {
  res.render('register')
})

router.post('/', async (req, res, next) => {
  let { firstName, lastName, email, userName, password } = req.body
  firstName = firstName.trim()
  lastName = lastName.trim()
  email = email.trim()
  userName = userName.trim()

  const payLoad = req.body

  if (firstName && lastName && email && password && userName) {

    const user = await User.findOne({
      $or: [{ userName: userName },
      { email: email }]
    }).catch((e) => {
      console.log(e)
      payLoad.errorMessage = 'some thing went wrong'
      res.status(200).render('register', payLoad)
    })


    if (user == null) {
      //No user found
      const data = req.body
      data.password = await bcrypt.hash(password,10)
      User.create(data).then((user)=>{
        req.session.user = user
        res.redirect('/')
      })
    } else {
      if (email == user.email) {
        payLoad.errorMessage = 'email already in use'
        res.status(200).render('register', payLoad)
      } else if (userName == user.userName) {
        payLoad.errorMessage = 'username already in use'
        res.status(200).render('register', payLoad)
      }
      res.status(200).render('register', payLoad)
    }




  } else {
    payLoad.errorMessage = 'Make sure that every field has a value'
    res.render('register', payLoad)
  }

})
module.exports = router