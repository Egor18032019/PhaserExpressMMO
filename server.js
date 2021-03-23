var express = require('express');
var app = express();
var server = require('http').Server(app);
//установили в качестве обработчика модуля http наш экземпляр app, что позволит Express обрабатывать HTTP-запросы.
var io = require('socket.io').listen(server);
// подключили socket.io к прослушиванию нашего server

var players = {};
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
  //указали серверу использовать файл index.html в качестве главной страницы.
});

io.on('connection', function (socket) {
  console.log('подключился пользователь');
  // создание нового игрока и добавление его в объект players
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
  // отправляем объект players новому игроку
  socket.emit('currentPlayers', players);
  // обновляем всем другим игрокам информацию о новом игроке
  socket.broadcast.emit('newPlayer', players[socket.id]);
  //отправит сообщение всем другим клиентам, кроме вновь созданного соединения
  
  // когда игроки движутся, то обновляем данные по ним
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
  //socket.id - с какого сокета было инициация события(передаеться по умолчанию)

    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // отправляем общее сообщение всем игрокам о перемещении игрока
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });
  // отправляем объект star новому игроку
  socket.emit('starLocation', star);
  // отправляем текущий счет
  socket.emit('scoreUpdate', scores);
  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;
    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });
  socket.on('disconnect', function () {
    console.log('пользователь отключился');
    // удаляем игрока из нашего объекта players 
    delete players[socket.id];
    // отправляем сообщение всем игрокам, чтобы удалить этого игрока
    io.emit('disconnect', socket.id); // отправляет всем клиентам на сервере
    // socket.emit отправляет ответное отправителю(новому пользователю в данном случае)
  });
});

server.listen(8081, function () {
  console.log(`Прослушиваем ${server.address().port}`);
});


/*
socket.emit('message', "this is a test"); //sending to sender-client only
socket.broadcast.emit('message', "this is a test"); //sending to all clients except sender
socket.broadcast.to('game').emit('message', 'nice game'); //sending to all clients in 'game' room(channel) except sender
socket.to('game').emit('message', 'enjoy the game'); //sending to sender client, only if they are in 'game' room(channel)
socket.broadcast.to(socketid).emit('message', 'for your eyes only'); //sending to individual socketid
io.emit('message', "this is a test"); //sending to all clients, include sender
io.in('game').emit('message', 'cool game'); //sending to all clients in 'game' room(channel), include sender
io.of('myNamespace').emit('message', 'gg'); //sending to all clients in namespace 'myNamespace', include sender
socket.emit(); //send to all connected clients
socket.broadcast.emit(); //send to all connected clients except the one that sent the message
socket.on(); //event listener, can be called on client to execute on server
io.sockets.socket(); //for emiting to specific clients
io.sockets.emit(); //send to all connected clients (same as socket.emit)
io.sockets.on() ; //initial connection from a client.
*/