const generateMessage = (username, messageText) => {
    return {
        username,
        text: messageText,
        createdAt: new Date().getTime()
    }
}

const generateImageMessage = (username, messageData) => {
    return {
        username,
        image: messageData,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateImageMessage,
    generateLocationMessage
}