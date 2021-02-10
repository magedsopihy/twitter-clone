const postTextarea = document.getElementById('postTextarea')
let cropper
let timer
let selectedUsers = []

$(document).ready(() => {
    updateMessageBadge()
    updateNotificationBadge()
})

$('#postTextarea, #replyTextarea').keyup((event) => {
    const textbox = $(event.target)
    const value = textbox.val().trim()

    const isModal = textbox.parents('.modal').length == 1

    const submitPostButton = isModal ? $('#submitReplyButton') : $('#submitPostButton')

    if (value == "") {
        submitPostButton.prop('disabled', true)
        return
    }
    submitPostButton.prop('disabled', false)
})
//submit post functionality
$('#submitReplyButton , #submitPostButton').click((event) => {
    const button = $(event.target)
    const isModal = button.parents('.modal').length == 1
    const textarea = isModal ? $('#replyTextarea') : $('#postTextarea')

    const data = {
        content: textarea.val()
    }

    if (isModal) {
        data.replyTo = button.data().id
    }
    //making post request using jquery
    $.post("/api/posts", data, postData => {

        if (postData.replyTo) {

            emitNotification(postData.replyTo.postedBy)

            location.reload()


        }

        const html = htmlPost(postData)
        $('.noResults').html('')
        $('.postContainer').prepend(html)
        //outputPosts(postData, $(".postContainer"))
        textarea.value = ""
        button.disabled = true

    })

})

// like button functionality
$(document).on("click", ".likeButton", (event) => {
    const button = $(event.target)
    const id = getPostIdFromElement(button)
    try {
        $.ajax({
            url: `/api/posts/${id}/like`,
            type: 'PUT',
            success: (postData) => {
                button.find('span').text(postData.likes.length || '')

                if (postData.likes.includes(userLoggedIn._id)) {
                    button.addClass('active')
                    emitNotification(postData.postedBy)
                }
                else {
                    button.removeClass('active')
                }

            }
        })
    } catch (e) {
        console.log(e)
    }

})

//retweet button functionality
$(document).on("click", ".retweetButton", (event) => {
    const button = $(event.target)
    const id = getPostIdFromElement(button)
    try {
        $.ajax({
            url: `/api/posts/${id}/retweet`,
            type: 'POST',
            success: (postData) => {
                // console.log(postData)
                button.find('span').text(postData.retweetUsers.length || '')

                if (postData.retweetUsers.includes(userLoggedIn._id)) {
                    button.addClass('active')
                    emitNotification(postData.postedBy)
                }
                else {
                    button.removeClass('active')
                }
            }
        })
    } catch (e) {
        console.log(e)
    }

})

$(document).on("click", ".post", (event) => {
    const element = $(event.target)
    const id = getPostIdFromElement(element)

    //check if the id undefined and is not a button

    if (id !== undefined && !element.is('button')) {
        window.location.href = '/posts/' + id
    }

})

//add reply functionality 
$('#replyModal').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)
    $('#submitReplyButton').data('id', postId)


    $.get(`/api/posts/${postId}`, (results) => {
        outputPosts(results.postData, $('.originalPost'))
    })
})

//clear modal right before closing
$('#replyModal').on('hidden.bs.modal', (event) => {
    $('.originalPost').html('')
})

//add delet post functionality 
$('#deletePost').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)

    $('#deletePostButton').data('id', postId)

})

$('#deletePostButton').click((event) => {
    const id = $(event.target).data('id')

    try {
        $.ajax({
            url: `/api/posts/${id}`,
            type: 'DELETE',
            success: (postData) => {
                location.reload()
            }
        })
    } catch (e) {
        console.log(e)
    }
})

//follow button functionality 
$(document).on("click", ".followButton", (event) => {
    const button = $(event.target)
    const id = button.data().user

    try {
        $.ajax({
            url: `/api/user/${id}/follow`,
            type: 'PUT',
            success: (data, status, xhr) => {

                if (xhr.status == 404) {
                    return alert('user not found')
                }
                let differance = 1;
                if (data.following && data.following.includes(id)) {
                    button.addClass("following")
                    button.text("Following")
                    emitNotification(id)

                }
                else {
                    button.removeClass("following")
                    button.text("Follow")
                    differance = -1;
                }
                let followersLabel = $('#followersValue')
                if (followersLabel.length != 0) {
                    let follewersText = followersLabel.text()
                    follewersText = parseInt(follewersText)
                    followersLabel.text(follewersText + differance)
                }

            }
        })
    } catch (e) {
        console.log(e)
    }

})

//crop the uploaded Image
$('#filePhoto').change(function () {
    // const input = $(event.target)
    if (this.files && this.files[0]) {
        let reader = new FileReader()
        reader.readAsDataURL(this.files[0])
        reader.onload = (e) => {
            let image = document.getElementById('imagePreview')
            image.src = e.target.result

            if (cropper !== undefined) {
                cropper.destroy()
            }
            cropper = new Cropper(image, {
                aspectRatio: 1 / 1,
                background: false,
                viewMode: 0,
            })
        }

    }
})

//crop the cover photo
$('#fileCover').change(function () {
    // const input = $(event.target)
    if (this.files && this.files[0]) {
        let reader = new FileReader()
        reader.readAsDataURL(this.files[0])
        reader.onload = (e) => {
            let image = document.getElementById('coverPreview')
            image.src = e.target.result

            if (cropper !== undefined) {
                cropper.destroy()
            }
            cropper = new Cropper(image, {
                aspectRatio: 16 / 9,
                background: false,
                viewMode: 0,
            })
        }

    }
})

//save the image after cropping it 
$('#uploadImageButton').click(() => {
    let canvas = cropper.getCroppedCanvas()

    if (canvas == null) {
        alert('could not upload the image')
        return
    }
    canvas.toBlob((blob) => {
        let formData = new FormData()
        formData.append("croppedImage", blob)
        $.ajax({
            url: '/api/user/profilePic',
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: (data) => location.reload()
        })
    })
})

$('#uploadCoverButton').click(() => {
    let canvas = cropper.getCroppedCanvas()

    if (canvas == null) {
        alert('could not upload the image')
        return
    }
    canvas.toBlob((blob) => {
        let formData = new FormData()
        formData.append("croppedImage", blob)
        $.ajax({
            url: '/api/user/coverPic',
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: (data) => location.reload()
        })
    })
})

//confirm pin post
$('#confirmPinPost').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)

    $('#confirmPinButton').data('id', postId)

})

$('#confirmPinButton').click((event) => {
    const id = $(event.target).data('id')

    try {
        $.ajax({
            url: `/api/posts/${id}`,
            data: { pinned: true },
            type: 'PUT',
            success: (postData) => {
                location.reload()
            }
        })
    } catch (e) {
        console.log(e)
    }
})

//confirm unpin post 
$('#confirmUnpinPost').on('show.bs.modal', (event) => {
    const button = $(event.relatedTarget)
    const postId = getPostIdFromElement(button)

    $('#confirmUnpinButton').data('id', postId)

})

$('#confirmUnpinButton').click((event) => {
    const id = $(event.target).data('id')

    try {
        $.ajax({
            url: `/api/posts/${id}`,
            data: { pinned: false },
            type: 'PUT',
            success: (postData) => {
                location.reload()
            }
        })
    } catch (e) {
        console.log(e)
    }
})

//user search for chatting group 
$('#userSearchTextBox').keydown((event) => {
    clearTimeout(timer)
    const textBox = $(event.target)

    timer = setTimeout(() => {
        const value = textBox.val().trim()

        if (value == "" || (event.keyCode == 8 || event.which == 8)) {
            selectedUsers.pop()
            updateSelectedUsersHtml()
            $('.resultsContainer').html("")

            if (selectedUsers.length == 0) {
                $('#createChatButton').prop("disabled", true)
            }
            return
        } else {
            searchUsers(value)
        }
    }, 1000);

})

// handle on click to create chat button 
$('#createChatButton').click(() => {
    const data = JSON.stringify(selectedUsers)

    $.post('/api/chat', { users: data }, (chat) => {
        window.location.href = `/messages/${chat._id}`
    })
})

//get chat name if it exisit and create one if not exsists
function getChatName(chatdata) {
    let chatName = chatdata.chatName
    if (!chatName) {
        const otherChatUsers = getOtherChatUser(chatdata.users)
        const namesArray = otherChatUsers.map((user) => user.firstName + " " + user.lastName)
        chatName = namesArray.join(", ")
    }

    return chatName
}

function getOtherChatUser(users) {
    if (users.length == 1) return users
    return users.filter((user) => user._id != userLoggedIn._id)
}

//attach click handler to the notification 
$(document).on("click", ".notification.active", (e) => {
    const container = $(e.target)
    const notificationId = container.data().id
    const href = container.attr('href')
    e.preventDefault()

    const callback = () => window.location = href

    markNotificationAsOpend(notificationId, callback)
})
/********************************************/
//           HELPER FUNCTIONS              //
/******************************************/

//get post id
function getPostIdFromElement(element) {
    const rootElement = element.hasClass('post') ? element : element.closest('.post')
    const postId = rootElement.data().id

    if (postId === undefined) return alert('post id is undefined')

    return postId

}

//create html post content
function htmlPost(postData, largeFont = false) {
    if (postData == null) return 'Post object is null'

    const isRetweeted = postData.retweetData !== undefined
    const retweetedBy = isRetweeted ? postData.postedBy.userName : null
    postData = isRetweeted ? postData.retweetData : postData

    let user = postData.postedBy

    if (user._id == undefined) return console.log('User object not populated')

    const time = timeDifference(new Date(), new Date(postData.createdAt))
    const activeOrNot = postData.likes.includes(userLoggedIn._id) ? 'active' : ''
    const retweetOrNot = postData.retweetUsers.includes(userLoggedIn._id) ? 'active' : ''
    const largeFontClass = largeFont ? 'largeFont' : ''

    let retweetText = ''

    if (isRetweeted) {
        retweetText = `<span>Retweeted by <a href="/profile/${retweetedBy}"> <i class="fas fa-retweet"> </i>@${retweetedBy}</a></span>`
    }

    let replyFlag = ''

    if (postData.replyTo) {
        if (!postData.replyTo._id) {
            return alert('replyTo is not populated')
        }
        if (!postData.replyTo._id && !postData.replyTo.postedBy._id) {
            return alert('postedBy is not populated')
        }
        const replyToUsername = postData.replyTo.postedBy.userName

        replyFlag = `<div class='replyFlag'>
                        Replaying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                    </div>`

    }

    //add delete icon button 
    let button = ''
    let pinnedPostText = ''
    if (postData.postedBy._id == userLoggedIn._id) {
        let pinnedClass = ''
        let pinToggleModal = "#confirmPinPost"
        if (postData.pinned === true) {
            pinToggleModal = "#confirmUnpinPost"
            pinnedClass = 'active'
            pinnedPostText = `<i class="fas fa-thumbtack"></i> <span>Pinned Post</span>`
        }
        button = `<button class="pinned ${pinnedClass}" data-id="${postData._id}" data-toggle="modal"  data-target="${pinToggleModal}"><i class="fas fa-thumbtack"></i> </button>
        <button data-id="${postData._id}" data-toggle="modal"  data-target="#deletePost"><i class="fas fa-times"></i> </button>`
    }

    return ` 
    <div class="retweetTextContainer">${retweetText}</div>
    <div class="post  ${largeFontClass}" data-id="${postData._id}">
                <div class="mainContentContainer">
                    <div class="userImageContainer">
                         <img src=${user.profilePic}>
                    </div>
                    
                    <div class="postContentContainer">
                        <div class="pinnedPostText">${pinnedPostText}</div>
                        <div class="header">
                            <a href='/profile/${user.userName}' class="displayName">${user.firstName} ${user.lastName}</a>
                            <span class="username">@${user.userName}</span>
                            <span class="date">${time}</span>
                            ${button}
                        </div>
                        ${replyFlag}
                        <div class="postBody">
                            ${postData.content}
                        </div>
                    <div class="postFooter">
                        <div class="postButtonContainer">
                            <button data-toggle="modal" data-target="#replyModal">
                                <i class="far fa-comment"> </i>
                            </button>
                        </div>
                        <div class="postButtonContainer green">    
                            <button class="retweetButton ${retweetOrNot}">
                                <i class="fas fa-retweet"> </i>
                                <span>${postData.retweetUsers.length || ''}</span>
                            </button>
                        </div>
                        <div class="postButtonContainer red">    
                            <button class="likeButton ${activeOrNot}">
                                <i class="far fa-heart"> </i>
                                <span>${postData.likes.length || ''}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`
}

//make readable time
function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if (elapsed / 1000 < 30) return 'just now';
        return Math.round(elapsed / 1000) + ' seconds ago';
    }

    else if (elapsed < msPerHour) {
        return Math.round(elapsed / msPerMinute) + ' minutes ago';
    }

    else if (elapsed < msPerDay) {
        return Math.round(elapsed / msPerHour) + ' hours ago';
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed / msPerDay) + ' days ago';
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed / msPerMonth) + ' months ago';
    }

    else {
        return 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago';
    }
}

//outpot comming data with any container
function outputPosts(results, container) {

    if (results.length == 0) {
        return container.append("<span class='noResults'>No posts to show</span>")
    }
    if (!Array.isArray(results)) {
        results = [results]

    }
    container.html('')
    results.forEach(result => {

        const html = htmlPost(result)

        container.append(html)
    });


}

function outputPostWithReplies(results, container) {
    container.html('')

    if (results.replyTo !== undefined && results.replyTo._id) {
        let html = htmlPost(results.replyTo)
        container.append(html)
    }

    let mainPostHtml = htmlPost(results.postData, true)
    container.append(mainPostHtml)

    results.replies.forEach(reply => {
        let replyHtml = htmlPost(reply)
        container.append(replyHtml)
    })
}

//output users
function outputUsers(results, container) {

    container.html("")
    if (results.length > 0) {
        results.forEach(user => {

            const html = createUserHtml(user, true)
            container.append(html)
        });
    } else {

        container.append('<span class="noReasults"> no results found</span>')
    }
}

function createUserHtml(userData, showFollowButton) {
    const name = `${userData.firstName} ${userData.lastName}`
    const isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id)
    const text = isFollowing ? 'Following' : 'Follow'
    const buttonClass = isFollowing ? "followButton following" : "followButton"

    let button = ''
    if (showFollowButton && userLoggedIn._id != userData._id) {
        button = `<div class=""followButtonContainer>
                            <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                        </div>`
    }

    let html = `<div class="user">
                    <div class="userImageContainer">
                        <img src="${userData.profilePic}">
                    </div>
                    <div class="userDetailsContainer">
                        <div class="header">
                            <a href="/profile/${userData.userName}">${name}</a>
                            <span class="username">@${userData.userName}</span>
                            
                        </div>    
                    </div>
                    ${button}
                </div>`

    return html
}

//ajax call search for users
function searchUsers(searchTerm) {
    $.get('/api/user', { search: searchTerm }, (results) => {
        outputSelectedUsers(results, $('.resultsContainer'))
    })
}

function outputSelectedUsers(results, container) {

    container.html("")

    results.forEach(user => {

        if (user._id == userLoggedIn._id || selectedUsers.some(u => u._id == user._id)) {
            return
        }

        const html = createUserHtml(user, false)
        let element = $(html)

        element.click(() => {
            userSelected(user)

        })
        container.append(element)
    });

    if (results.length == 0) {
        container.append('<span class="noReasults"> no results found</span>')
    }
}

function userSelected(user) {
    selectedUsers.push(user)
    updateSelectedUsersHtml()
    $('#userSearchTextBox').val("").focus()
    $('.resultsContainer').html("")
    $('#createChatButton').prop("disabled", false)
}

function updateSelectedUsersHtml() {
    let users = []
    selectedUsers.forEach((user) => {
        const name = `${user.firstName} ${user.lastName}`
        const namesHtml = `<span class="selectedUser">${name}</span>`
        users.push(namesHtml)
    })
    $('.selectedUser').remove()
    $('#selectedUsers').prepend(users)


}

function recieveMessage(newMessage) {
    if ($(`[data-room=${newMessage.chat._id}]`).length == 0) {
        showMessagePopUp(newMessage)
    } else {
        //console.log(newMessage)
        addChatMessagesHtml(newMessage)
    }
    updateMessageBadge()
}

//mark notification as opend
function markNotificationAsOpend(notificationId = null, callback = null) {
    if (callback == null) callback = () => location.reload()

    const url = notificationId != null ? `/api/notification/${notificationId}/markasopend` : '/api/notification/markasopend'
    $.ajax({
        url: url,
        type: "PUT",
        success: callback
    })
}

function updateMessageBadge() {
    $.get('/api/chat', { unreadOnly: true }, (data) => {

        const numOfResults = data.length
        if (numOfResults > 0) {
            $('#messageBadge').text(numOfResults).addClass('active')
        } else {
            $('#messageBadge').text("").removeClass('active')
        }
    })
}

function updateNotificationBadge() {
    $.get('/api/notification', { unreadOnly: true }, (data) => {

        const numOfResults = data.length

        if (numOfResults > 0) {
            $('#notificationsBadge').text(numOfResults).addClass('active')
        } else {
            $('#notificationsBadge').text("").removeClass('active')
        }
    })
}

function createNotificationHtml(notification) {
    const userFrom = notification.userFrom
    const text = getNotificationText(notification)
    const url = getNotificationUrl(notification)
    let className = notification.opened ? "" : "active"

    return `<a href="${url}" class="resultsListItem notification ${className}" data-id="${notification._id}">
                <div class="resultsImageContainer">
                    <img src="${userFrom.profilePic}">
                </div>
                <div class="resultsDetailsContainer ellipsis">
                    <span class="ellipsis">${text}</span>
                </div>
            </a>`
}

function getNotificationText(notification) {

    const userFrom = notification.userFrom
    const name = `${userFrom.firstName} ${userFrom.lastName}`
    let text = ""



    if (notification.notificationType == "post like") {
        text = `${name} likes your post`
    }

    else if (notification.notificationType == "follow") {
        text = `${name} followed you`
    }

    else if (notification.notificationType == "retweet") {
        text = `${name} retweet your post`
    }

    else if (notification.notificationType == "reply") {
        text = `${name} replies to your post`
    }

    return `<span class="ellipsis">${text}</span>`

}

function getNotificationUrl(notification) {
    let url = "#"

    if (notification.notificationType == "post like" ||
        notification.notificationType == "retweet" ||
        notification.notificationType == "reply") {
        url = `/posts/${notification.entityId}`
    }

    else if (notification.notificationType == "follow") {
        url = `/profile/${notification.entityId}`
    }

    return url

}

function showNotificationPopUp(notificationData) {
    const html = createNotificationHtml(notificationData)
    const element = $(html)

    element.hide().prependTo('#notificationPopUp').slideDown('fast')

    setTimeout(() => {
        element.fadeOut(400)
    }, 5000)
}

function showMessagePopUp(data) {
    if (data.chat.latestMessage !== undefined &&!data.chat.latestMessage._id) {
        data.chat.latestMessage = data
    }

    const html = createChatHtml(data.chat)
    const element = $(html)

    element.hide().prependTo('#notificationPopUp').slideDown('fast')

    setTimeout(() => {
        element.fadeOut(400)
    }, 5000)
}

function createChatHtml(chatData) {
    const chatName = getChatName(chatData) // TODO
    const image = getChatImageElements(chatData)
    const latestMessage = getLatestMessage(chatData.latestMessage)
    const activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active"

    return `<a href="/messages/${chatData._id}" class="resultsListItem ${activeClass}">
                ${image}
                <div class="resultsDetailsContainer ellipsis">
                    <span class="heading ellipsis">${chatName}</span>
                    <span class="subText ellipsis">${latestMessage}</span>
                </div>
            </a>`
}

//get latest message 
function getLatestMessage(latestMessage) {
    if (latestMessage != null) {
        const sender = latestMessage.sender
        latestMessage = `${sender.firstName} ${sender.lastName} : ${latestMessage.content}`
        return latestMessage
    }

    return 'latestMessage not found'
}

function getChatImageElements(chatData) {
    const otherChatUsers = getOtherChatUser(chatData.users)

    let groupChatClass = ''
    let chatImages = getChatImageElement(otherChatUsers[0])
    if (otherChatUsers.length > 1) {
        groupChatClass = "groupChatImage"
        chatImages += getChatImageElement(otherChatUsers[1])
    }

    return `<div class="resultsImageContainer ${groupChatClass}"> ${chatImages}</div>`
}

function getChatImageElement(user) {
    if (!user || !user.profilePic) {
        alert('Invaild user passed to a function')
    }

    return `<img src="${user.profilePic}" alt="user's profile Image">`
}