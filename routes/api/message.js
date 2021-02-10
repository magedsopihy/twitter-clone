
const express = require('express')
const Message = require('../../models/message')
const Chat = require('../../models/chat')
const User = require('../../models/users')
const Notification = require('../../models/notification')
const router = express.Router()

router.post('/', async (req, res) => {
    if (!req.body || !req.body.chatId) {
        return res.status(400).send('Invalid  message')
    }
    const messageData = req.body
    const data = {
        sender: req.session.user._id,
        content: messageData.content,
        chat: messageData.chatId,

    }
    try {
        let newMessage = await Message.create(data)
        newMessage = await newMessage.populate('sender').populate('chat').execPopulate()
        newMessage = await User.populate(newMessage, { path: "chat.users" })
        const chat = await Chat.findByIdAndUpdate(messageData.chatId, { latestMessage: newMessage })
        insertMessageNotifications(chat ,newMessage)

        res.status(201).send(newMessage)
    } catch (e) {
        console.log(e)
        res.sendStatus(400)
    }

})

function insertMessageNotifications(chat, message) {
    chat.users.forEach(userId => {
        if (userId == message.sender._id) return

        Notification.insertNotifications(userId, message.sender._id, "new message", message.chat._id)
    });
}
module.exports = router