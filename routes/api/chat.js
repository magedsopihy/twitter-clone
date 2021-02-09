const { compareSync } = require('bcrypt')
const express = require('express')
const Chat = require('../../models/chat')
const User = require('../../models/users')
const Message = require('../../models/message')
const router = express.Router()

router.post('/', async (req, res) => {


    if (!req.body.users) {

        console.log('data does not send from the client')
        res.sendStatus(400)
    }
    let users = await JSON.parse(req.body.users)

    if (users.length == 0) {
        res.sendStatus(400)
        console.log('array is empty')
    }
    users.push(req.session.user)
    const chatData = {
        users: users,
        isGroupChat: true,
    }

    try {
        const result = await Chat.create(chatData)
        res.status(201).send(result)
    } catch (e) {
        res.sendStatus(400)
        console.log(e)
    }

})

router.get('/', async (req, res) => {
    try {
        let chats = await Chat.find({ users: { $elemMatch: { $eq: req.session.user._id } } })
            .populate('users')
            .populate('latestMessage')
            .sort({ updatedAt: -1 })

        chats = await User.populate(chats, { path: 'latestMessage.sender' })

        if (req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {

            chats = chats.filter((r) => r.latestMessage && !r.latestMessage.readBy.includes(req.session.user._id))
        }

        res.send(chats)
    } catch (e) {
        res.sendStatus(400)
        console.log(e)
    }
})

router.get('/:chatId', async (req, res) => {
    try {
        const users = await Chat.findOne({ _id: req.params.chatId, users: { $elemMatch: { $eq: req.session.user._id } } })
            .populate('users')


        res.send(users)
    } catch (e) {
        res.sendStatus(400)
        console.log(e)
    }
})

router.get('/:chatId/messages', async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId }).populate('sender')

        res.send(messages)
    } catch (e) {
        res.sendStatus(400)
        console.log(e)
    }
})

router.put('/:chatId', async (req, res) => {
    const chatId = req.params.chatId
    const data = req.body
    try {
        await Chat.findByIdAndUpdate(chatId, { chatName: data.chatName })
        res.status(204).send('updated')
    } catch (e) {
        console.log(e)
        res.sendStatus(400)
    }
})

router.put('/:chatId/markAsRead', async (req, res) => {
    const chatId = req.params.chatId

    try {
        await Message.updateMany({ chat: chatId }, { $addToSet: { readBy: req.session.user._id } })
        res.status(204)
    } catch (e) {
        console.log(e)
        res.sendStatus(400)
    }
})
module.exports = router