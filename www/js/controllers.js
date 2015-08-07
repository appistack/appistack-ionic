angular.module('appistack.controllers', [])
  .controller('AppCtrl', function ($scope, $state, $ionicModal, $auth) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    $scope.loginData = {};
    $scope.loginAlerts = [];
    $scope.signupData = {};
    $scope.signupAlerts = [];

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
      $scope.loginAlerts = [];
      $auth.submitLogin($scope.loginData)
        .then(function (res) {
          $scope.loginAlerts = [];
          $scope.loginModal.hide();
          //TODO: nav to home
        })
        .catch(function (res) {
          $scope.loginAlerts = _.map(res.errors, function (e) {
            return {type: 'error', msg: e};
          });
          $scope.openLoginModal();
        });
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
      $scope.signupAlerts = [];
      $auth.submitRegistration({
        email: $scope.signupData.email,
        username: $scope.signupData,
        password: $scope.signupData,
        password_confirmation: $scope.signupData.passwordConfirmation
      })
        .then(function (res) {
          $scope.signupAlerts = [];
          $scope.signupModal.hide();
          //TODO: prompt user to confirm their account
          //TODO: nav to login
        })
        .catch(function (res) {
          if (res.status == 401 || res.status == 403) {
            $scope.signupAlerts = _.map(res.data.errors.full_messages, function (msg) {
              return {type: "error", msg: msg};
            });
          }
        });
    };

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
