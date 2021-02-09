const express = require('express')
const router = express.Router()
const Notification = require('../../models/notification')


router.get('/', async (req, res) => {
    let searchObj = {
        userTo: req.session.user._id,
        notificationType: { $ne: 'new message' }
    }

    if (req.query.unreadOnly !== undefined && req.query.unreadOnly == "true") {
        searchObj.opened = false
    }

    try {
        const notification = await Notification.find(searchObj)
            .populate('userTo')
            .populate('userFrom')
            .sort({ createdAt: -1 })
        res.status(200).send(notification)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})


router.get('/latest', async (req, res) => {
   

    try {
        const notification = await Notification.findOne({userTo: req.session.user._id})
            .populate('userTo')
            .populate('userFrom')
            .sort({ createdAt: -1 })
        res.status(200).send(notification)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

router.put('/:id/markasopend', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { opened: true })
        res.sendStatus(204)
    } catch {
        res.sendStatus(400)
        console.log(e)
    }
})

router.put('/markasopend', async (req, res) => {
    try {
        await Notification.updateMany({ opened: true })
        res.sendStatus(204)
    } catch {
        res.sendStatus(400)
        console.log(e)
    }
})

module.exports = router