const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    userName: { type: String, trim: true, required: true, unique: true },
    email: { type: String, trim: true, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: "/images/profilePic.jpg" },
    coverPic: { type: String, },
    likes:[{ type: mongoose.Schema.Types.ObjectId , ref:'Post' }],
    retweets:[{ type: mongoose.Schema.Types.ObjectId , ref:'Post' }],
    following:[{ type: mongoose.Schema.Types.ObjectId , ref:'User' }],
    followers:[{ type: mongoose.Schema.Types.ObjectId , ref:'User' }],

},{timestamps:true})

const User = mongoose.model('User', userSchema)

module.exports = User

