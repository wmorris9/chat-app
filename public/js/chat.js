const socket = io()
let srcData = ''

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $imageInput = document.querySelector('#send-image')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const imageTemplate = document.querySelector('#image-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageMargin = parseInt(getComputedStyle($newMessage).marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // View height
    const viewHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight
    
    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + viewHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    } 
}


const encode = () => {
  let selectedfile = document.getElementById("send-image").files;
  if (selectedfile.length > 0) {
    const imageFile = selectedfile[0];
    const fileReader = new FileReader();
    fileReader.onload = (fileLoadedEvent) => {
      srcData = fileLoadedEvent.target.result;
      const newImage = document.createElement('img');
      newImage.src = srcData;
    }
    fileReader.readAsDataURL(imageFile);
  }
}

socket.on('receiveMessage', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('receiveImage', (message) => {
    const html = Mustache.render(imageTemplate, {
        username: message.username,
        imageData: message.image,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('receiveLocation', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        location: message.url,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    if ($imageInput.files[0]) {
        socket.emit('sendImage', srcData, (message) => {
            $imageInput.value = null
            $messageFormInput.focus()
        })
    }
    
    if (e.target.elements.message.value) {
        socket.emit('sendMessage', e.target.elements.message.value, (message) => {
            $messageFormInput.value = ''
            $messageFormInput.focus()
        })
    }
    
    $messageFormButton.removeAttribute('disabled')
})

$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})