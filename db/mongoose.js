const mongoose = require('mongoose')


//connect to database
mongoose.connect('mongodb://127.0.0.1:27017/twitter',{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology: true,
    useFindAndModify:false
})