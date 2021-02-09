
$('#searchBox').keydown((event) => {
    clearTimeout(timer)
    const textBox = $(event.target)

    const searchType = textBox.data().search
    timer = setTimeout(() => {
        const value = textBox.val().trim()

        if (value == "") {

            $('.resultsContainer').html("")
        } else {
            doSearch(value, searchType)
        }
    }, 1000);

})

function doSearch(searchTerm, searchType) {
    const url = searchType === "users" ? "/api/user" : "/api/posts"

    $.get(url, { search: searchTerm }, (results) => {
        if (searchType == "users") {
            outputUsers(results, $('.resultsContainer'))
        } else {
            outputPosts(results, $('.resultsContainer'))
        }
    })
}