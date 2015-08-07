angular.module('appistack', [
  'ionic',
  'ngMessages',
  'ipCookie',
  'ng-token-auth',
  'restangular',
  'appistack.auth',
  'appistack.config',
  'appistack.controllers',
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

  .config(function(RestangularProvider, ENV) {
    RestangularProvider.setBaseUrl(ENV.apiUrl);
    RestangularProvider.setDefaultHeaders({
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json,text/plain;version=1'
    })
  })

  .config(function($authProvider, ENV) {
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
    $stateProvider

      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
      })

      .state('app.search', {
        url: '/search',
        views: {
          'menuContent': {
            templateUrl: 'templates/search.html'
          }
        }
      })

      .state('app.browse', {
        url: '/browse',
        views: {
          'menuContent': {
            templateUrl: 'templates/browse.html'
          }
        }
      })
      .state('app.playlists', {
        url: '/playlists',
        views: {
          'menuContent': {
            templateUrl: 'templates/playlists.html',
            controller: 'PlaylistsCtrl'
          }
        }
      })

      .state('app.single', {
        url: '/playlists/:playlistId',
        views: {
          'menuContent': {
            templateUrl: 'templates/playlist.html',
            controller: 'PlaylistCtrl'
          }
        }
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/playlists');
  });
