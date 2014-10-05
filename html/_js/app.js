var app = angular.module('flazy', ['ngRoute']);

app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/', {
      templateUrl: '_templates/work.html', 
      controller: 'HomeCtrl'
    })
    .when('/about', {
      templateUrl: '_templates/about.html', 
      controller: 'HomeCtrl'
    })
    .when('/details/:id', {
      templateUrl: '_templates/details.html', 
      controller: 'DetailsCtrl'
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
      $http.get('http://hackmizzou.cloudapp.net:8080/login/' + user + '/' + password)
        .success(function(data, status) {
          console.log(data);
        })
        .error(function(data, status) {
          console.log(status);
        });
    }
}]);
