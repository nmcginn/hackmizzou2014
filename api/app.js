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
var twil_sid = 'ACbac69bddb9715cbdcc4efc98b3d76ef0';
var twil_tok = storage.getItem('twilio_auth_token');
var twilio = require('twilio')(twil_sid,twil_tok);

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

app.get('/acceptorder/:driver/:uuid', function(req, res) {
  var token = req.get('token');
  var authenticated = checkToken(req.params.driver, token);
  if (authenticated) {
    res.set({'Content-Type':'application/json'});
    var orders = storage.getItem('orders');
    var valid = false;
    for (var i = 0; i < orders.length; i++) {
      if (orders.id === req.params.uuid) {
        orders[i].status = 'Accepted';
        orders[i].driver = req.params.driver;
        valid = true;
      }
    }
    if (valid) {
      storage.setItem('orders',orders);
      twilio.messages.create({
        to: '+16302169653',
        from: '+16303184442',
        body: 'Your fLazy order has been accepted by a driver!',
      }, function(err, message) {
        console.log(message.sid);
      });
    }
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

// create order / select item
// input - post request in form of json with what was ordered and the quantity and special requests
// returns payment object
app.post('/order/new', function(req, res) {
    res.set({'Content-Type':'text/html'});
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
    res.set({'Content-Type':'text/html'});
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

function getNewUserId(username) {
  var users = storage.getItem('users');
  var id = 0;
  for (var i = 0; i < users.length; i++) {
    if (users[i].id >= id) id = users[i].id + 1;
    if (username === users[i].username) return false;
  }
  return id;
}

function ProfPic (req, res){
      res.set({'Content-Type':'application/json'});
        for(var i =0; i<users.length; i++){
                if(user===users[i].username){
                          var profPic=users[i].profpic}
                  }
          res.send(profPic);
}

app.get('/profpic/:username', ProfPic);
