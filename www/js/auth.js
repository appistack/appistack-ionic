angular.module('appistack.auth', [])
  .run(function ($rootScope, $state) {

    //TODO: pull token/etc from keychain?
    $rootScope.user = $rootScope.user || {};
    $rootScope.loggedIn = $rootScope.loggedIn || false;

    function setLoggedOut() {
      $rootScope.user = {};
      $rootScope.loggedIn = false;
    }

    function loginSuccess(ev, user) {
      $rootScope.user = user;
      $rootScope.loggedIn = true;
    }

    function loginError(ev, reason) {
      setLoggedOut();
    }

    function logoutSuccess(ev) {
      setLoggedOut();
      $state.go('app');
    }

    function logoutError(ev, reason) {
      console.log([ev, reason]);
    }

    $rootScope.$on('auth:login-success', loginSuccess);
    $rootScope.$on('auth:login-error', loginError);
    $rootScope.$on('auth:validation-success', loginSuccess);
    $rootScope.$on('auth:validation-error', loginError);
    $rootScope.$on('auth:logout-success', logoutSuccess);
    $rootScope.$on('auth:logout-error', logoutError);

  })

;