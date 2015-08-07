angular.module('appistack', [
  'ionic',
  'ngMessages',
  'ipCookie',
  'ng-token-auth',
  'restangular',
  'appistack.auth',
  'appistack.config',
  'appistack.controllers',
  'appistack.spectro',
  'appistack.services'])

  .run(function ($rootScope, $ionicPlatform) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function (RestangularProvider, ENV) {
    RestangularProvider.setBaseUrl(ENV.apiUrl);
    RestangularProvider.setDefaultHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json,text/plain;version=1'
    })
  })

  .config(function ($authProvider, ENV) {
    $authProvider.configure({
      apiUrl: ENV.apiHost,
      validateOnPageLoad: true,
      confirmationSuccessUrl: ENV.webUrl,
      passwordResetSuccessUrl: ENV.webUrl + '/password/change',
      authProviderPaths: {
        google_oauth2: '/auth/google_oauth2'
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    function authRoute($auth, $state, $rootScope) {
      return $auth.validateUser()
        .catch(function(res) {
          $state.go('app.home');
        });
    }

    $stateProvider
      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })

      .state('app.home', {
        url: '/home',
        views: {
          menuContent: {
            templateUrl: 'templates/home.html'
          }
        }
      })

      .state('app.settings', {
        url: '/settings',
        views: {
          menuContent: {
            controller: 'UserEditCtrl',
            templateUrl: 'templates/users/edit.html'
          }
        },
        resolve: {
          auth: authRoute,
          user: function(Users, $auth) {
            return Users.one($auth.user.id).get();
          }
        }
      })

      .state('app.user', {
        url: '/users/:id',
        views: {
          menuContent: {
            controller: 'UserDetailCtrl',
            templateUrl: 'templates/users/detail.html'
          }
        },
        resolve: {
          auth: authRoute,
          user: function ($stateParams, Users) {
            return Users.one($stateParams.id).get();
          }
        }
      })

      .state('app.users', {
        url: '/users',
        views: {
          menuContent: {
            controller: 'UsersCtrl',
            templateUrl: 'templates/users/index.html'
          }
        },
        resolve: {
          auth: authRoute,
          users: function (Users, $ionicLoading) {
            //TODO: alternatively, use a restangular/$http intercepter and broadcast loading events on $rootScope
            $ionicLoading.show({template: 'Loading ...'});
            return Users.getList().then(function (users) {
              $ionicLoading.hide();
              return users;
            }, function (res) {
              //TODO: handle error
              $ionicLoading.hide();
              return [];
            });
          }
        }
      })

      .state('app.artists', {
        url: '/artists',
        views: {
          menuContent: {
            controller: 'ArtistsCtrl',
            templateUrl: 'templates/artists/index.html'
          }
        },
        resolve: {
          auth: authRoute,
          artists: function (Artists, $ionicLoading) {
            $ionicLoading.show({template: 'Loading ...'});
            return Artists.getList().then(function (users) {
              $ionicLoading.hide();
              return users;
            }, function (res) {
              //TODO: handle error
              $ionicLoading.hide();
              return [];
            });
          }
        }
      })

      .state('app.artist', {
        url: '/artists/:id',
        views: {
          menuContent: {
            controller: 'ArtistDetailCtrl',
            templateUrl: 'templates/artists/detail.html'
          }
        },
        resolve: {
          auth: authRoute,
          audio: function (SpectroAudio) { return SpectroAudio; },
          mic: function (SpectroMic) { return SpectroMic; },
          artist: function($stateParams, Artists) {
            return Artists.one($stateParams.id).get();
          }
        }
      })

    ;
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');
  });

navigator.getUserMedia =
  (navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia);

window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.requestAnimationFrame = (function (){
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(cb, el) {
      window.setTimeout(cb, 1000 / 60)
    };
})();
