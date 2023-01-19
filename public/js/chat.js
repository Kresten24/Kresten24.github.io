//to connect to the server gets the io function from socket.io.js
const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = document.querySelector("#msg");
const $messageFormButton = document.querySelector("#submit");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () =>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // Get the height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
      $messages.scrollTop = $messages.scrollHeight
    }
}

//receive event that server sends the name of the event has to match with event in the server (socket.emit)
// socket.on('countUpdated', (count)=>{
//     console.log("count is updated", count)
// })

//add event listener to the button
// const button = document.querySelector('#increment')
// button.addEventListener('click', ()=>{
//     console.log('clicked')
//     //send event to server from client
//     socket.emit('increment')
// })

socket.on("locationMessage", (url) => {
  console.log(url);
  const html = Mustache.render(locationTemplate, {
    username: url.username,
    url: url.url,
    createdAt: moment(url.createdAt).format("h:mm:ss A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

//3rd callback function in emit function is used for event acknowledgement
socket.on("message", (msg) => {
  console.log(msg.text);
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("h:mm:ss A"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on('roomData', ({room, users})=>{
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  let msg = document.querySelector("#msg").value;
  socket.emit("sendMessage", msg, (err) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (err) {
      return console.log(err);
    }
    console.log("Message delivered");
  });
});

document.querySelector("#send-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("location shared");
      }
    );
  });
});

socket.emit("join", { username, room }, (error)=>{
  if(error){
    alert(error)
    location.href='/'
  }
});
