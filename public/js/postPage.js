$(document).ready(() => {
    $.get('/api/posts/'+postId, (results) => {
       
        outputPostWithReplies(results, $(".postContainer"))
    })
})

