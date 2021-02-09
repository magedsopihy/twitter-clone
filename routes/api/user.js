const fs = require('fs')
const express = require('express')

const multer = require('multer')
const path = require('path')
const upload = multer({ dest: 'uploads/' })
const route = express.Router()

const User = require('../../models/users')

const Notification = require('../../models/notification')

route.get('/', async (req, res) => {
    let searchObj = req.query
    if (searchObj !== undefined) {
        searchObj = {
            $or: [{ firstName: { $regex: searchObj.search, $options: "i" } },
            { lastName: { $regex: searchObj.search, $options: "i" } },
            { username: { $regex: searchObj.search, $options: "i" } }
            ]
        }
    }

    try {
        const results = await User.find(searchObj)
        res.status(200).send(results)
    } catch (e) {
        console.log(e)
        res.sendStatus(400)
    }
})


route.put('/:id/follow', async (req, res) => {
    const userId = req.params.id
    const user = await User.findById(userId)
    if (!userId || !req.session.user._id) return res.status(404).send()
    if (user == null) return res.status(404).send()

    const isFollowing = user.followers && user.followers.includes(req.session.user._id)
    const options = isFollowing ? "$pull" : "$addToSet"

    try {
        req.session.user =
            await User.findByIdAndUpdate(req.session.user._id, { [options]: { following: userId } }, { new: true })
        await User.findByIdAndUpdate(userId, { [options]: { followers: req.session.user._id } }).catch((e) => console.log(e))


    } catch (e) {
        return res.status(400).send()
    }

    if (!isFollowing) {
        try {
            await Notification.insertNotifications(userId, req.session.user._id, "follow", req.session.user._id)
        } catch (e) {
            console.log(e)
        }
    }

    return res.status(202).send(req.session.user)
})

// return all following 
route.get('/:id/following', async (req, res) => {
    const userId = req.params.id
    try {
        const user = await User.findById(userId).populate('following')
        res.status(200).send(user)
    } catch (e) {
        res.status(400).send()
        console.log(e)
    }

})
route.get('/:id/followers', async (req, res) => {
    const userId = req.params.id
    try {
        const user = await User.findById(userId).populate('followers')
        res.status(200).send(user)
    } catch (e) {
        res.status(400).send()
        console.log(e)
    }

})

route.post('/profilePic', upload.single('croppedImage'), async (req, res) => {

    if (!req.file) {
        console.log('cant  uploag image')
        res.status(400).send()
    }
    const filePath = `/uploads/images/${req.file.filename}.png`
    const tempPath = req.file.path
    const targetPath = path.join(__dirname, `../../${filePath}`)
    fs.rename(tempPath, targetPath, (e) => {
        if (e != null) {
            console.log(e)
            return res.sendStatus(400)
        }
    })
    try {
        req.session.user = await User.findByIdAndUpdate(req.session.user._id, { profilePic: filePath }, { new: true })
    } catch (e) {
        console.log(e)
        return res.sendStatus(400)
    }

    res.status(204).send()

})

route.post('/coverPic', upload.single('croppedImage'), async (req, res) => {

    if (!req.file) {
        console.log('cant  uploag image')
        res.status(400).send()
    }
    const filePath = `/uploads/images/${req.file.filename}.png`
    const tempPath = req.file.path
    const targetPath = path.join(__dirname, `../../${filePath}`)
    fs.rename(tempPath, targetPath, (e) => {
        if (e != null) {
            console.log(e)
            return res.sendStatus(400)
        }
    })
    try {
        req.session.user = await User.findByIdAndUpdate(req.session.user._id, { coverPic: filePath }, { new: true })
    } catch (e) {
        console.log(e)
        return res.sendStatus(400)
    }

    res.status(204).send()

})
module.exports = route