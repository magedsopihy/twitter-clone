let typing = false
let lastTypingTime
// load chat name if it exisit or make one 
$(document).ready(() => {

    socket.emit("join room", chatId)

    socket.on("typing", () => {
        $('.typingContainer').show()
    })

    socket.on("stop typing", () => {
        $('.typingContainer').hide()
    })

    $.get(`/api/chat/${chatId}`, (data) => $('#chatName').text(getChatName(data)))

    $.get(`/api/chat/${chatId}/messages`, (data) => {
        let messages = []
        let lastSenderId = ""
        data.forEach((message, index) => {
            const html = createMessageHtml(message, data[index + 1], lastSenderId)
            messages.push(html)
            lastSenderId = message.sender._id
        })

        const messagesHtml = messages.join("")
        addMessageHtmlToPage(messagesHtml)
        scrollToTheBottom(false)
        markAllMessageAsRead()
        $('.loadingSpinnerContainer').remove()
        $('.chatContainer').css('visibility', 'visible')
    })
})

//change chat name 
$('#chatNameModalButton').click(() => {
    const newChatName = $('#chaneNameInputText').val().trim()

    $.ajax({
        url: '/api/chat/' + chatId,
        data: { chatName: newChatName },
        type: 'PUT',
        success: (data, status, xhr) => {
            if (xhr.status != 204) {
                alert('failed to update chat name')
            } else {
                location.reload()
            }
        }
    })

})

//submit message when pressing the button
$('.sendMessageButton').click(() => {
    sendMessage()

})

//submit message when enter key is pressed
$('#messageTextArea').keydown((event) => {

    updateTyping()

    if (event.which === 13) {

        sendMessage()
        return false
    }

})

//updating typing notification

function updateTyping() {
    if (!connected) {
        return
    }

    if (!typing) {
        typing = true
        socket.emit("typing", chatId)
    }
    lastTypingTime = new Date().getTime()
    const timerLength = 3000

    setTimeout(() => {
        const timeNow = new Date().getTime()
        const timeDiff = timeNow - lastTypingTime

        if (timeDiff >= timerLength && typing == true) {
            socket.emit("stop typing", chatId)
            typing = false
        }
    }, timerLength)
}

//send the message
function sendMessage() {
    let messageTexrArea = $('#messageTextArea')
    const message = messageTexrArea.val().trim()
    if (message == "") {
        return
    }
    // post the message to the server

    $.post('/api/messages/', { content: message, chatId: chatId }, (data, status, xhr) => {

        if (xhr.status != 201) {
            alert('could not send the message')
            $('#messageTextArea').val(message)
            return
        }
        addChatMessagesHtml(data)

        if(connected){
            socket.emit("new message" ,data)
        }


    })

    //empty text area
    messageTexrArea.val("")
    socket.emit("stop typing", chatId)
    typing = false
   
}

function addChatMessagesHtml(message) {
    if (!message || !message._id) {
        alert('not valid message')
    }

    const messageHtml = createMessageHtml(message, null, '')
    addMessageHtmlToPage(messageHtml)
    scrollToTheBottom(true)
}

function createMessageHtml(message, nextMessage, lastSenderId) {
    let isMine = message.sender._id == userLoggedIn._id
    let liClassName = isMine ? "mine" : "theirs"
    let senderElement = ""
    let imageContainer = ''
    let senderImage = ''

    const sender = message.sender
    const senderName = sender.firstName + " " + sender.lastName

    const currentSenderId = sender._id
    const nextSenderId = nextMessage != null ? nextMessage.sender._id : ""

    const isFirst = lastSenderId != currentSenderId
    const isLast = nextSenderId != currentSenderId

    if (isFirst) {
        liClassName += " first"

        if (!isMine) {
            senderElement = `<span class="senderNameElement">${senderName}</span>`
        }
    }

    if (isLast) {
        liClassName += " last"
        if (!isMine) {
            senderImage = `<img src="${sender.profilePic}" alt="User's profile Picture">`
        }
    }

    if (!isMine) {
        imageContainer = ` <div class= "imageContainer">
                            ${senderImage}
                        </div>`
    }

    return `<li class="message ${liClassName}">
                ${imageContainer}
                <div class="messageContainer">
                    ${senderElement}
                    <span class="messageBody">
                        ${message.content}
                    </span>
                </div>
            </li>`
}

function addMessageHtmlToPage(html) {
    $('.chatMessages').append(html)
}

function scrollToTheBottom(animated) {
    const container = $('.chatMessages')
    const scrollHeight = container[0].scrollHeight
    if (animated) {
        container.animate({ scrollTop: scrollHeight }, 'slow')
    } else {
        container.scrollTop(scrollHeight)
    }
}

function markAllMessageAsRead(){
    $.ajax({
        url:`/api/chat/${chatId}/markAsRead`,
        type: 'PUT',
        success: updateMessageBadge()
    })
}