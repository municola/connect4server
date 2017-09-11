const io = require('socket.io')(4003, {
  path: '/',
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
  console.log(socket.id, 'connected');
  socket.on('connectMe', (username) => {
    members.push([socket.id, username]);
    socket.emit('connected');
    socket.emit('update', howManyPeople(howMany));

    socket.emit('updateMembers', members);
    socket.broadcast.emit('updateMembers', members);

    socket.broadcast.emit('newUser', 2, username);
  });
  socket.on('send', (message, username) => {
    socket.broadcast.emit('newMessage', 1, username, message);
    socket.emit('newMessage', 0, username, message);
  });
  socket.on('gameMessage', (roomId, message, username) => {
    socket.emit('newGameMessage', 0, username, message);
    socket.to(roomId).emit('newGameMessage', 1, username, message);
  });
  socket.on('subscribe', (roomId) => {
    const people = howManyPeople(howMany);
    if (people[roomId] === 1) {
      socket.join(roomId);
      howMany[roomId].push(socket.id);
      socket.emit('confirmed', roomId);
      socket.emit('ready', 'X', 'Your Turn');
      socket.to(roomId).emit('ready', 'O', 'Enemy Turn');

      socket.emit('players', howMany[roomId][0]);
      socket.to(roomId).emit('players', howMany[roomId][1]);

      socket.emit('firstTurn');
      socket.emit('update', howManyPeople(howMany));
      socket.broadcast.emit('update', howManyPeople(howMany));
    }
    if (people[roomId] === 0) {
      socket.join(roomId);
      howMany[roomId].push(socket.id);
      socket.emit('confirmed', roomId);
      socket.emit('update', howManyPeople(howMany));
      socket.broadcast.emit('update', howManyPeople(howMany));
    }
  });
  socket.on('turn', (table) => {
    socket.to(socket.rooms[Object.keys(socket.rooms)[0]]).emit('turn', table);
  });
  socket.on('winner', () => {
    socket.to(socket.rooms[Object.keys(socket.rooms)[0]]).emit('winner');
  });
  socket.on('unsubscribe', (roomId) => {
    socket.leave(roomId);
    for (let i = 0; i < howMany.length; i++) {
      howMany[i] = howMany[i].filter((item) => {
        return item !== socket.id;
      });
    }
    socket.emit('unsubscribed');
    socket.emit('update', howManyPeople(howMany));
    socket.broadcast.emit('update', howManyPeople(howMany));
  });
  socket.on('disconnect', () => {
    console.log(socket.id, 'disconnect');
    for (let i = 0; i < howMany.length; i++) {
      howMany[i] = howMany[i].filter((item) => {
        return item !== socket.id;
      });
      for (let j = 0; j < 2; j++) {
        if (howMany[i][j] === socket.id) {
          socket.leave(howMany[i][j]);
        }
      }
    }
    console.log(members);
    members = members.filter((item) => {
      return item[0] !== socket.id;
    });
    console.log(members);
    socket.broadcast.emit('update', howManyPeople(howMany));
    socket.broadcast.emit('updateMembers', members);
  });
});
