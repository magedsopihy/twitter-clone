let connected = false

const socket = io('http://localhost:3000')

socket.emit("setup", userLoggedIn)

socket.on("connected", () => {
    connected = true

})

socket.on("message", (newMessage) => {

    recieveMessage(newMessage)
})

socket.on("notification received", () => {

    $.get('/api/notification/latest', (notificationData) => {
        showNotificationPopUp(notificationData)
        updateNotificationBadge()

    })

})

function emitNotification(userId) {
   
    if (userId !== userLoggedIn._id) {
        socket.emit("notification received", userId)
    }
    return

}