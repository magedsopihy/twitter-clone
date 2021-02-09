$(document).ready(() => {
    $.get('/api/notification', (data) => {
        outputNotifactionList(data, $('.resultsContainer'))

    })
})

$('#markAllNotificationsAsRead').click(()=>{
    markNotificationAsOpend()
})

function outputNotifactionList(notifications, container) {
    notifications.forEach(notification => {
        if(notification.userFrom._id == userLoggedIn._id){
            return
        }
        const html = createNotificationHtml(notification)
        container.append(html)

    });

    if (notifications.length == 0) [
        container.append('<span class="noResualts">Nothing to show</span>')
    ]


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