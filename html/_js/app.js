var app = angular.module('flazy', ['ngRoute']);

app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/', {
      templateUrl: '_templates/index.html', 
      controller: 'LoginCtrl'
    })
    .when('/driver_dash', {
      templateUrl: '_templates/driver_dash.html', 
      controller: 'DriverDashCtrl'
    })
    .when('/hungry_dash', {
      templateUrl: '_templates/hungry_dash.html', 
      controller: 'HungryDashCtrl'
    })
    .when('/account', {
      templateUrl: '_templates/account.html', 
      controller: 'AccountCtrl'
    })
    .otherwise({ redirectTo: '/' });
}]);

app.controller('LoginCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.isLogin = true;
    $scope.flipPage = function() {
      $scope.isLogin = !$scope.isLogin;
    }
    $scope.login = function() {
      var user = document.getElementById('username').value;
      var password = document.getElementById('password').value;
      $http.get('http://hackmizzou.cloudapp.net/login/' + user + '/' + password)
        .success(function(data, status) {
          localStorage.setItem('token', data.token); // persist session token
          window.location.href = 'http://hackmizzou.cloudapp.net/#/driver_dash';
        })
        .error(function(data, status) {
          alert('Your username or password is incorrect.');
        });
    }
}]);
