angular.module('appistack.controllers', [])
  .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.loginData = {};
    $scope.signupData = {};

    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.loginModal = modal;
    });

    $scope.closeLogin = function () {
      $scope.loginModal.hide();
    };

    $scope.login = function () {
      $scope.loginModal.show();
    };

    $scope.doLogin = function () {
      console.log('Doing login', $scope.loginData);

      $timeout(function () {
        $scope.closeLogin();
        $rootScope.loggedIn = true
      }, 1000);
    };

    $ionicModal.fromTemplateUrl('templates/signup.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.signupModal = modal;
    });

    $scope.closeSignup = function () {
      $scope.signupModal.hide();
    };

    $scope.signup = function () {
      $scope.signupModal.show();
    };

    $scope.doSignup = function () {
      console.log('Doing signup', $scope.signupData);

      $timeout(function () {
        $scope.closeLogin();
      }, 1000);
    }

  })

  .controller('PlaylistsCtrl', function ($scope) {
    $scope.playlists = [
      {title: 'Reggae', id: 1},
      {title: 'Chill', id: 2},
      {title: 'Dubstep', id: 3},
      {title: 'Indie', id: 4},
      {title: 'Rap', id: 5},
      {title: 'Cowbell', id: 6}
    ];
  })

  .controller('PlaylistCtrl', function ($scope, $stateParams) {
  });
