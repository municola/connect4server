const io = require('socket.io')(3000, {
  serveClient: false,
  // below are engine.IO options
  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

const howMany = [[], [], [], [], []];
let members = [];

function howManyPeople(arr) {
  return arr.map((item) => {
    return item.length;
  });
}

io.on('connection', (socket) => {
  socket.on('connectMe', (username) => {
    console.log('asdfh');
    socket.nickname = username;
    members.push([socket.id, username]);

    socket.emit('connected');
    socket.emit('update', howManyPeople(howMany));
    socket.emit('updateMembers', members);

    socket.broadcast.emit('updateMembers', members);
    socket.broadcast.emit('newUser', 2, username);
  });
  socket.on('sendMessage', (message, username) => {
    socket.broadcast.emit('newMessage', 1, username, message);
    socket.emit('newMessage', 0, username, message);
  });
  socket.on('sendGameMessage', (roomId, message, username) => {
    socket.emit('newGameMessage', 0, username, message);
    socket.to(roomId).emit('newGameMessage', 1, username, message);
  });
  socket.on('subscribe', (roomId, username) => {
    const people = howManyPeople(howMany);
    if (people[roomId] === 1) {
      socket.join(roomId);
      howMany[roomId].push(socket.id);

      socket.to(roomId).emit('playerJoined', 2, username);
      socket.to(roomId).emit('ready', 'O', 'Enemy Turn', false);

      socket.emit('subscribed', howManyPeople(howMany), roomId);
      socket.emit('ready', 'X', 'YourTurn', true);
      console.log('ready');

      socket.broadcast.emit('update', howManyPeople(howMany));
    }
    if (people[roomId] === 0) {
      socket.join(roomId);
      howMany[roomId].push(socket.id);

      socket.emit('subscribed', howManyPeople(howMany), roomId);

      socket.broadcast.emit('update', howManyPeople(howMany));
    }
  });
  socket.on('turn', (table) => {
    socket.to(socket.rooms[Object.keys(socket.rooms)[0]]).emit('turn', table);
  });
  socket.on('winner', () => {
    socket.to(socket.rooms[Object.keys(socket.rooms)[0]]).emit('winner');
  });
  socket.on('unsubscribe', (roomId, username) => {
    socket.leave(roomId);
    for (let i = 0; i < howMany.length; i++) {
      howMany[i] = howMany[i].filter((item) => {
        return item !== socket.id;
      });
    }
    socket.to(roomId).emit('playerLeft', 2, username);
    socket.emit('unsubscribed');
    socket.emit('update', howManyPeople(howMany));
    socket.broadcast.emit('update', howManyPeople(howMany));
  });
  socket.on('disconnect', () => {
    let username = undefined;
    for (let i = 0; i < members.length; i++) {
      if (members[i][0] === socket.id) {
        username = members[i][1];
      }
    }
    for (let i = 0; i < howMany.length; i++) {
      for (let j = 0; j < 2; j++) {
        if (howMany[i][j] === socket.id) {
          socket.leave(i);
          socket.to(i).emit('playerLeft', 2, username);
        }
        howMany[i] = howMany[i].filter((item) => {
          return item !== socket.id;
        });
      }
    }
    members = members.filter((item) => {
      return item[0] !== socket.id;
    });
    if (username !== '' && username !== null && username !== undefined) {
      socket.broadcast.emit('userLeft', 2, username);
      socket.broadcast.emit('update', howManyPeople(howMany));
      socket.broadcast.emit('updateMembers', members);
    }
  });
});
