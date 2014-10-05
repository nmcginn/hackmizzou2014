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

app.controller('SplashCtrl', ['$scope', '$http', function($scope) {

    $scope.hi = "hi";

}]);

app.controller('LoginCtrl', ['$scope', '$http', function($scope) {
    $scope.isLogin = true;
    $scope.flipPage = function() {
      $scope.isLogin = !$scope.isLogin;
    }
}]);

app.controller('DetailsCtrl', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {

  $http.get('_js/details.json').
    success(function(data, status, headers, config) {

      $scope.details = data;

      if ($routeParams.id !== undefined) {
        $scope.showcase = $scope.details[$routeParams.id];

        $scope.title = $scope.showcase['title'];
        $scope.desc = $scope.showcase['desc'];
        $scope.thumbnail = $scope.showcase['thumbnail'];
        $scope.link = $scope.showcase['link'];
      }
      
    }).
    error(function(data, status, headers, config) {
      // log error
    });

}]);