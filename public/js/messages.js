$(document).ready(() => {
    $.get('/api/chat', (data, status, xhr) => {
        if (xhr.status == 400) {
            alert('some thing went wrong on the server')
        } else {
            outputMessageHtml(data, $('.resultsContainer'))
        }
    })
})


function outputMessageHtml(chatList, container) {
    chatList.forEach(chat => {
        const chaHtml = createChatHtml(chat)
        container.append(chaHtml)
    });

    if (chatList == 0) {
        container.append('<span class="noReasults"> no results found</span>')
    }
}

