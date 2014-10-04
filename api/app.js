// requires
var express = require('express');
var app = express();
var parser = require('body-parser');
var storage = require('node-persist');
var uuid = require('node-uuid');
var crypto = require('crypto');

// initialization code
storage.initSync();
app.use(parser.urlencoded({extended:true}));

app.post('/register', function(req, res) {
  console.log(req.body);
  // id, username, fname, lname, address, phone, email, lat, long, balance, rating, password, guid
  var users = storage.getItem('users');
  var new_user = JSON.parse(req.body.user);
  new_user.id = getNewUserId(new_user.username);
  new_user.balance = 0.0;
  new_user.lat = 0.0;
  new_user.long = 0.0;
  new_user.rating = 0;
  if (new_user.id) {
    var sha = crypto.createHash('sha512');
    console.log(new_user.password);
    sha.update(new_user.password);
    new_user.password = sha.digest('base64');
    users.push(new_user);
    storage.setItem('users',users);
    res.send(new_user);
  } else {
    res.send(400);
  }
});

app.get('/', function(req, res) {
  res.send(200);
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
    //console.log(menu);
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

app.get('/openorders', function(req, res) {
  res.set({'Content-Type':'application/json'});
  var open = [];
  var orders = storage.getItem('orders');
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].status === 'Pending') {
      open.push(orders[i]);
    }
  }
  res.send(open);
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

// create order / select item
// input - post request in form of json with what was ordered and the quantity and special requests
// returns payment object
app.post('/order/new', function(req, res) {
    res.set({'Constent-Type':'text/html'});
    // create the order in the database
    var orders = app.get('order');
    newOrder = JSON.parse(req);
    var uuid = uuid.v4();
    newOrder.elements[0].orderID = uuid;
    newOrderStr = JSON.stringify(newOrder);
    orders.push(newOrderStr);
    app.set('orders',orders);
    res.send("<Response><Message>200</Message></Response>"); // should return payment object later
});

// confirm order / make payment
// get request confirmation of order
// returns 200 on confirmation
app.get('/order/confirmation', function(req, res) {
    res.set({'Constent-Type':'text/html'});
    // process the payment
    // subtract from consumer account
    res.send("<Response><Message>200</Message></Response>");
});

app.get('/twilio', function(req, res) {
  res.set({'Content-Type':'text/xml'});
  res.send('<Response><Message>Coffee makes me poop</Message></Response>');
});

// start the server
var server = app.listen(8080, function() {
  console.log('Listening on port %d', server.address().port);
});

// start utility methods
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

function getNewUserId(username) {
  var users = storage.getItem('users');
  var id = 0;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id >= id) id = users[i].id + 1;
    if (username === users[i].username) return false;
  }
  return id;
}
