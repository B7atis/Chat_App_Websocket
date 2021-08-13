const express = require('express');
const path = require('path');
const socket = require('socket.io');

const messages = [];
const users = [];

const app = express();

app.use(express.static(path.join(__dirname, '/client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/client/index.html'));
});

const server = app.listen(8000, () => {
  console.log('Server is running on Port:', 8000);
});

const io = socket(server);

io.on('connection', (socket) => {  // Nasłuchiwacz na automatyczny event ('connection') emitowany przez klienta socket, który się podłącza
  console.log('New client! Its id – ' + socket.id);
  socket.on('login', (login) => {
    console.log('new user logged' + socket.id);
    users.push({ login, id: socket.id });
    socket.broadcast.emit('newUser', {
      author: 'Chat Bot',
      content: `${login} has joined the conversation!`,
    });
  });

  socket.on('message', (message) => {
    console.log("Oh, I've got something from " + socket.id);
    messages.push(message);  // Dzięki broadcast emitujemu event do wszystkich socketów, oprócz tego, z którego go wysyłamy
    socket.broadcast.emit('message', message);
  });

  socket.on('disconnect', () => {  // Nasłuchiwacz na zamknięcie połączenia z klientem, który w momencie zamknięcia również emituje automatyczny event 'disconnect'
    console.log('Oh, socket ' + socket.id + ' has left');

    const leavingUser = users.find((user) => user.id == socket.id);
    const userIndex = users.indexOf(leavingUser);
    if (leavingUser) {
      socket.broadcast.emit('userLeft', {
        author: 'Chat Bot',
        content: `${leavingUser ? leavingUser.login : 'user'
          } has left the conversation!`,
      });
      users.splice(userIndex, 1);
    }
  });

  console.log("I've added a listener on message event \n");
});

app.use((req, res) => {
  res.status(404).send('404 not found...');
});

