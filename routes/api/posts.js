const express = require('express')
const route = express.Router()
const Post = require('../../models/posts')
const User = require('../../models/users')
const Notification = require('../../models/notification')

//get all posts route
route.get('/', async (req, res) => {
    const searchObj = req.query
    if (searchObj.isReply !== undefined) {
        const isReply = searchObj.isReply == "true";
        searchObj.replyTo = { $exists: isReply }
        delete searchObj.isReply;
    }
    if (searchObj.followingOnly !== undefined) {
        const followingOnly = searchObj.followingOnly == "true";

        if (followingOnly) {
            //collect all user id that loggin user followed
            let objectIds = []
            if (!req.session.user.following) {
                req.session.user.following = []
            }
            req.session.user.following.forEach(user => {
                objectIds.push(user)
            })
            objectIds.push(req.session.user._id)
            searchObj.postedBy = { $in: objectIds }
        }
        delete searchObj.followingOnly;
    }

    if (searchObj.search !== undefined) {
        searchObj.content = { $regex: searchObj.search, $options: "i" }
        delete searchObj.search
    }
    try {
        const results = await getPosts(searchObj)
        res.send(results)
    } catch (e) {
        res.status(400).send()
    }

})

//get post by id
route.get('/:id', async (req, res) => {
    const postId = req.params.id
    try {
        let postData = await getPosts({ _id: postId })
        postData = postData[0]
        let results = {
            postData: postData
        }

        if (postData.replyTo !== undefined) {
            results.replyTo = postData.replyTo
        }

        results.replies = await getPosts({ replyTo: postId })
        return res.status(200).send(results)

    } catch (e) {
        console.log(e)
        return res.status(400).send
    }
})
//post a new post route
route.post('/', async (req, res) => {

    if (!req.body.content) {
        console.log('content not found in the request')
        return res.status(400).send()
    }

    const postData = {
        content: req.body.content,
        postedBy: req.session.user
    }

    if (req.body.replyTo) {
        postData.replyTo = req.body.replyTo
    }

    try {
        let newPost = await Post.create(postData)
        newPost = await User.populate(newPost, { path: 'postedBy' })
        newPost = await Post.populate(newPost, { path: 'replyTo' })
        if(newPost.replyTo !== undefined){
           
            await Notification.insertNotifications(newPost.replyTo.postedBy, req.session.user._id, "reply", newPost._id)
        }
    

        res.status(201).send(newPost)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
})

//like post route
route.put('/:id/like', async (req, res) => {
    const postId = req.params.id
    const userId = req.session.user._id

    const isLiked = req.session.user.likes && req.session.user.likes.includes(postId)
    const options = isLiked ? '$pull' : '$addToSet'

    //isert user likes    البوستات اللى المحروس عملها لايك 
    try {
        req.session.user = await User.findByIdAndUpdate(userId, { [options]: { likes: postId } }, { new: true })
        const post = await Post.findByIdAndUpdate(postId, { [options]: { likes: userId } }, { new: true })
        res.send(post)
        if (!isLiked) {
            await Notification.insertNotifications(post.postedBy, userId, "post like", postId)
        }
    } catch (e) {
        console.log(e)
    }

})


// retweet post route
route.post('/:id/retweet', async (req, res) => {


    const postId = req.params.id;
    const userId = req.session.user._id;

    // Try and delete retweet
    const deletedPost = await Post.findOneAndDelete({ postedBy: userId, retweetData: postId })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })

    const option = deletedPost != null ? "$pull" : "$addToSet";

    let repost = deletedPost;

    if (repost == null) {
        repost = await Post.create({ postedBy: userId, retweetData: postId })
            .catch(error => {
                console.log(error);
                res.sendStatus(400);
            })
    }

    // Insert user like
    req.session.user = await User.findByIdAndUpdate(userId, { [option]: { retweets: repost._id } }, { new: true })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })

    // Insert post like
    const post = await Post.findByIdAndUpdate(postId, { [option]: { retweetUsers: userId } }, { new: true })
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })

        if (!deletedPost ) {
            try {
                await Notification.insertNotifications(post.postedBy, userId, "retweet", postId)
            } catch (e) {
    
                console.log(e)
            }
        }
    res.status(200).send(post)
})

route.delete('/:id', async (req, res) => {
    const postId = req.params.id

    try {
        await Post.findOneAndDelete({ _id: postId })
        res.status(200).send('DELETED')
    } catch (e) {
        res.status(500).send(e)
        console.log(e)
    }
})

// pint the post
route.put('/:id', async (req, res) => {
    const postId = req.params.id

    if (req.body.pinned !== undefined) {
        await Post.updateMany({ postedBy: req.session.user }, { pinned: false }).catch((e) => {
            console.log(e)
            res.sendStatus(400)
        })
    }

    try {
        await Post.findByIdAndUpdate(postId, { pinned: req.body.pinned })
        res.sendStatus(204)
    } catch (e) {
        res.status(400).send(e)
        console.log(e)
    }
})
//get posts
async function getPosts(filter) {
    try {
        let posts = await Post.find(filter).populate('postedBy').populate('retweetData').populate('replyTo').sort({ 'createdAt': -1 })
        //await User.populate(posts, { path: 'postedBy' })
        posts = await User.populate(posts, { path: 'replyTo.postedBy' })
        const post = await User.populate(posts, { path: 'retweetData.postedBy' })
        return post

    } catch (e) {
        console.log(e)
        return e
    }
}
module.exports = route