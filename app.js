const path = require('path')
const express = require('express')
const session = require('express-session')

require('./db/mongoose')
const middleware = require('./middleware/middleware')
const loginRoute = require('./routes/loginRoutes')
const registerRoute = require('./routes/registerRoute')
const logoutRoute = require('./routes/logoutRoute')
const postsAPIRoute = require('./routes/api/posts')
const postRoute = require('./routes/postRoutes')
const profileRoute = require('./routes/profileRoute')
const userRoute = require('./routes/api/user')
const uploadRoute = require('./routes/uploadRoutes')
const searchRoute = require('./routes/searchRoutes')
const messagesRoute = require('./routes/messageRoutes')
const chatRoute = require('./routes/api/chat')
const message = require('./routes/api/message')
const notificationsRoute = require('./routes/notifications')
const notification = require('./routes/api/notification')

const app = express()
const PORT = process.env.PORT 

app.set('view engine', 'pug')
app.set('views', 'views')

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')))

app.use(session({
    secret:process.env.APP_SECRET,
    resave: true,
    saveUninitialized: false,
}))
app.use('/uploads',middleware.requireLogin, uploadRoute)
//Routes
app.use('/login', loginRoute)
app.use('/register', registerRoute)
app.use('/logout', logoutRoute)

app.use('/api/posts', middleware.requireLogin ,postsAPIRoute)
app.use('/posts', middleware.requireLogin, postRoute)

app.use('/profile', middleware.requireLogin, profileRoute)
app.use('/search', middleware.requireLogin, searchRoute)

app.use('/api/user', userRoute)
app.use('/messages', middleware.requireLogin, messagesRoute)
app.use('/api/chat', middleware.requireLogin, chatRoute)
app.use('/api/messages', middleware.requireLogin, message)
app.use('/notifications', middleware.requireLogin, notificationsRoute)
app.use('/api/notification', middleware.requireLogin, notification)


app.get('/', middleware.requireLogin, (req, res, next) => {

    const payLoad = {
        title: 'Home',
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),
    }
    res.render('home', payLoad)
})

const server = app.listen(PORT, () => {
    console.log(`server is UP on port ${PORT}`)
})

const io = require('socket.io')(server ,{pingTimeOut:60000})

io.on('connection' ,socket =>{
    
    socket.on("setup",(userData)=>{
        socket.join(userData._id)
        socket.emit("connected")
       
    })

    socket.on("join room" , room => socket.join(room))
    socket.on("typing" , room => socket.in(room).emit("typing"))
    socket.on("stop typing" , room => socket.in(room).emit("stop typing"))

    socket.on("notification received" , room => socket.in(room).emit("notification received"))
    
    socket.on("new message" , (newMessage) => {
          const chat = newMessage.chat
          if(!chat.users) return "chat.users not populated"

          chat.users.forEach(user => {
              if(user._id == newMessage.sender._id) return 
              
              socket.in(user._id).emit("message" , newMessage)
          });
    })
})