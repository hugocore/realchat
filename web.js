var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(56565);

app.use(express.logger());
app.use(express.static(__dirname + '/'));

function handler (req, res) {

	var url = "";
	if (req['url'] == "/")
		url = "/index.html";
  	else
  		url = req['url'];

  	console.log("URL:" + req['url']);

  	if (fs.existsSync(__dirname + url)) {

		fs.readFile(__dirname + url, function (err, data) {
			if (err) {
			  res.writeHead(500);
			  console.log('Error loading ' + url);
			  return res.end('Error loading ' + url);			  
			}

			res.writeHead(200);
			res.end(data);
		});

	}
}

var users = [];
var messages = [];

// Socket server
io.sockets.on('connection', function(socket) {

	// First send the current users
	socket.emit('userList', users);
	console.log("Users List:" + users);

	// Send the last 10msgs
	var lasmsg = [];
	for (var i=messages.length-1, z=0; z<10 && i>0; i--, z++)
		lasmsg.push(messages[i]);
	socket.emit('lastMsgs', lasmsg.reverse());
	console.log("Last Msgs:" + lasmsg.reverse());

	// When a new user arrive
	socket.on('newUser', function (data) {

		console.log("New user entered the chat: " + data['nick']);

		var user = {nick: data['nick'], color: get_random_color()};
		users.push(user);
		socket.nick = data['nick'];

		// Ack the user
		socket.emit('newUser', user);

		// Update the other users
		socket.broadcast.emit('newUser', user);

	});

	// When a user leaves
	socket.on('disconnect', function () {

		// Remove user from list
		for (var i=0; i < users.length ; i++) {
			if (users[i].nick == socket.nick)
				users.splice(i, 1);
		}

		console.log("The user has left the chat: " + socket.nick);

		// Update the other users
		socket.broadcast.emit('delUser', {nick: socket.nick});

	});

	// When a user start writing
	socket.on('startWriting', function (data) {
		// Update the other users
		socket.broadcast.emit('startWriting', {nick: data['nick']});
	});

	// When a user start writing
	socket.on('stopWriting', function (data) {
		// Update the other users
		socket.broadcast.emit('stopWriting', {nick: data['nick']});
	});

	// When a user send a new message
	socket.on('newMessage', function (data) {

		var user = "";

		// Find color of user
		for (var i=0; i < users.length ; i++) {
			if (users[i].nick == socket.nick)
				user = users[i];
		}

		var msg = {nick: data['nick'], message: data['message'], color: user['color']};
		messages.push(msg);

		// Send to all
		socket.broadcast.emit('newMessage', msg);
		socket.emit('newMessage', msg);
	});

});

function get_random_color() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}