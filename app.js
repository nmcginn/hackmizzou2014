// requires
var express = require('express');
var app = express();
var storage = require('node-persist');
var uuid = require('node-uuid');
var crypto = require('crypto');

// initialization code
storage.initSync();

app.get('/', function(req, res) {
  res.set({'Content-Type':'application/json'});
  res.send({});
});

app.get('/hash/:hash', function(req, res) {
  res.set({'Content-Type':'text/plain'});
  var sha = crypto.createHash('sha512');
  sha.update(req.params.hash);
  res.send(sha.digest('base64'));
});

app.get('/menu/:restaurant', function(req, res) {
  console.log('trying to get ' + req.params.restaurant);
  var menu = storage.getItem(req.params.restaurant);
  if (menu) {
    res.set({'Content-Type':'application/json'});
    console.log(menu);
    res.send(menu);
  } else {
    res.send(404);
  }
});

app.get('/login/:user/:password', function(req, res) {
  res.set({'Content-Type':'application/json'});
  var users = storage.getItem('users');
  var validuser = false;
  var token = '';
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === req.params.user) {
      var sha = crypto.createHash('sha512');
      sha.update(req.params.password);
      if (users[i].password === sha.digest('base64')) {
        validuser = true;
        users[i].guid = uuid.v4();
        token = users[i].guid;
        break;
      } else {
        break;
      }
    }
  }
  if (validuser) {
    res.send({'token':token});
  } else {
    res.send({'error':'invalid username or password'});
  }
});

app.get('/account/:user', function(req, res) {
  var token = req.get('token');
  var authenticated = checkToken(req.params.user, token);
  if (authenticated) {
    res.set({'Content-Type':'application/json'});
    authenticated.password = undefined;
    res.send(authenticated);
  } else {
    res.send(403);
  }
});

app.get('/orders/:username', function(req, res) {
  var token = req.get('token');
  var authenticated = checkToken(req.params.username, token);
  if (authenticated) {
    var my_orders = [];
    var all_orders = storage.getItem('orders');
    for (var i = 0; i < all_orders.length; i++) {
      if (req.params.username === all_orders[i].fat_fuck ||
          req.params.username === all_orders[i].driver) {
        my_orders.push(all_orders[i]);
      }
    }
    res.send(my_orders);
  } else {
    res.send(403);
  }  
});

app.get('/twilio', function(req, res) {
  res.set({'Content-Type':'text/xml'});
  res.send('<Response><Message>Coffee makes me poop</Message></Response>');
});

var server = app.listen(8080, function() {
  console.log('Listening on port %d', server.address().port);
});

function checkToken(user, token) {
  var valid = false;
  var users = storage.getItem('users');
  for (var i = 0; i < users.length; i++) {
    if (user === users[i].username) {
      if (token === users[i].guid) {
        console.log(users[i].username + ' successfully authenticated');
        return users[i];
      } else {
        console.log('bad token ' + token);
        console.log('expected ' + users[i].guid);
        return false;
      }
    }
  }
  console.log('no user ' + user + ' found');
  return false;
}

function dbSetup() {
  storage.setItem('users',
    [
      {"id":1,"username":"mrjohn","fname":"John","lname":"MacArthur","address":"","phone":"6305551212","email":"me@john.com","lat":0.0,"long":0.0,"balance":25.37,"rating":0,"password":"sQnzu7wkTrgkQZF+0G1hi5AI3Qmzvv0bXgc5THBqi7mAsdd4Xll27ASbRt9fEyavWi6m0QP9B8lThf+rDKy8hg==","guid":""},
      {"id":2,"username":"mrmike","fname":"Mike","lname":"McDougles","address":"","phone":"6305125512","email":"me@mike.com","lat":0.0,"long":0.0,"balance":13.96,"rating":0,"password":"sQnzu7wkTrgkQZF+0G1hi5AI3Qmzvv0bXgc5THBqi7mAsdd4Xll27ASbRt9fEyavWi6m0QP9B8lThf+rDKy8hg==","guid":""},
      {"id":3,"username":"mrdave","fname":"Dave","lname":"O'Flanner","address":"","phone":"6555130212","email":"me@dave.com","lat":0.0,"long":0.0,"balance":100.17,"rating":0,"password":"sQnzu7wkTrgkQZF+0G1hi5AI3Qmzvv0bXgc5THBqi7mAsdd4Xll27ASbRt9fEyavWi6m0QP9B8lThf+rDKy8hg==","guid":""}
    ]
  );
  storage.setItem('restaurants',
    [
      {"id":1,"lat":0.0,"long":0.0,"menu_id":1},
      {"id":2,"lat":0.0,"long":0.0,"menu_id":1},
      {"id":3,"lat":0.0,"long":0.0,"menu_id":1}
    ]
  );
  storage.setItem('orders',
    [
      {'id':1,'driver':'mrdave','fat_fuck':'mrjohn','status':'Accepted'}
    ]
  );
}
