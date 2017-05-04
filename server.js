var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require ('body-parser');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var app = express();
var db = null;
var JWT_SECRET = 'unyppirate';

var mongoose = require('mongoose');

MongoClient.connect("mongodb://localhost:27017/UNYPNews", function(err, dbconn) {
	if(!err) {
		console.log("Rock'n'Roll"); //there is another way to do it
		db = dbconn;
	}
});

mongoose.connect('mongodb://localhost:27017/UNYPNews');

var Message = mongoose.model('Message', {
	text: String,
	username: String,
	user: String

});

app.use(bodyParser.json());

app.use(express.static('public'));

app.get('/messages', function(req, res, next) {
	db.collection('messages', function(err, messagesCollection) {
		messagesCollection.find().toArray(function(err, messages) {
			return res.json(messages);
		});
	});
});

app.post('/messages', function(req, res, next) {

	var token = req.headers.authorization;
	var user = jwt.decode(token, JWT_SECRET);

	console.log(req.body);

	var newMessage = new Message( {
		text : req.body.newMessage,
		username : user.username,
		user : user._id
	});

	newMessage.save(function(err) {
		return res.send();
	});
});

app.put('/messages/remove', function(req, res, next) {

	var token = req.headers.authorization;
	var user = jwt.decode(token, JWT_SECRET);

	db.collection('messages', function(err, messagesCollection) {	
		var messageId = req.body.message._id;
	
		messagesCollection.remove({_id : ObjectId(messageId), username : user.username}, {w:1}, function(err, result) {
			return res.send();
		});
	});
});

app.post('/users', function(req, res, next) {

	db.collection('users', function(err, usersCollection) {

		bcrypt.genSalt(10, function(err, salt) {
		    bcrypt.hash(req.body.password, salt, function(err, hash) {
		       var newUser = {
					username : req.body.username,
					password : hash
				};

				usersCollection.insert(newUser, {w:1}, function(err) {
					return res.send();
				});
		    });
		});
	});
});


app.put('/users/signin', function(req, res, next) {

	db.collection('users', function(err, usersCollection) {

		usersCollection.findOne( { username : req.body.username }, function(err, user) {

			bcrypt.compare(req.body.password, user.password, function(err, result) {
				if (result) {
					var token = jwt.encode(user, JWT_SECRET);
					return res.json({ token : token });
				} else {
					return res.status(400).send();
				}
			});
		});
	});
});

app.use(function(req, res) {
    res.sendfile(__dirname + '/Public/index.html');
});


app.listen(3000, function() {
	console.log("App is listening on port 3000!");
});