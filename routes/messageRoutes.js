const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const Chat = require('../models/chat')
const User = require('../models/users')

router.get('/', (req, res) => {
    const PayLoad = {
        title: "Message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }
    res.render('messagesPage', PayLoad)
})

router.get('/new', (req, res) => {
    const PayLoad = {
        title: "New Message",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user)
    }
    res.render('newNessagesPage', PayLoad)
})


router.get('/:chatId', async (req, res) => {
    const userId = req.session.user._id
    const chatId = req.params.chatId
    const validId = mongoose.isValidObjectId(chatId)

    let PayLoad = {
        title: "Chat",
        userLoggedIn: req.session.user,
        userLoggedInJs: JSON.stringify(req.session.user),

    }

    if (!validId) {
        PayLoad.errorMessage = "chat not found"
        return res.render('chatPage', PayLoad)
    }

    let chat = await Chat.findOne({ _id: chatId, users: { $elemMatch: { $eq: userId } } }).populate('users')

    if (chat == null) {
        const userFound = await User.findById(chatId)

        if (userFound != null) {
            chat = await getChatByUsersId(userId, userFound._id)
        }
    }


    if (chat == null) {
        PayLoad.errorMessage = "Chat not found"
    }
    else {
        PayLoad.chat = chat
    }

    res.render('chatPage', PayLoad)
})



async function getChatByUsersId(userLoggedInId, otherUserId) {

    try {
        const chatBetweenTwoUsers =
            await Chat.findOneAndUpdate({
                isGroupChat: false,
                users: {
                    $size: 2,
                    $all: [
                        { $elemMatch: { $eq: mongoose.Types.ObjectId(userLoggedInId) } },
                        { $elemMatch: { $eq: mongoose.Types.ObjectId(otherUserId) } },
                    ]
                }
            }, {
                $setOnInsert: {
                    users: [userLoggedInId, otherUserId]
                }
            }, {
                new: true,
                upsert: true,
            }).populate('users')

            return chatBetweenTwoUsers
    } catch (e) {
        console.log(e)
    }

}
module.exports = router