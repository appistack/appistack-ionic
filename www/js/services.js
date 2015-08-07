angular.module('appistack.services', [])

  .factory('RestDefaults', function(Restangular) {
    return Restangular.withConfig(function(RestangularConf) {
      // This request interceptor ensures that POST/PUT requests are sent in the format that rails expects.
      RestangularConf.addRequestInterceptor(function(elem, operation, path, url) {
        if (operation === 'post' || operation == 'put') {
          var requestElem = {};
          var modelName = path.substring(0, path.length - 1);
          requestElem[modelName] = elem;
          return requestElem;
        }
        return elem;
      });
    });
  })

  .factory('Users', function (RestDefaults, ENV) {
    var User = RestDefaults.service('users');
    RestDefaults.extendModel('users', function(model) {
      model.isAdmin = function() {
        return _.chain(this.roles)
          .map(function (r) { return r.name })
          .contains('admin')
          .value();
      };

      model.gravatarUrl = function(options) {
        options = options || { size: 100 }
        return this.gravatar_url + "&s=" + options.size;
      };

      return model;
    });

    return User;
  })

  .factory('Sounds', function (RestDefaults, ENV) {
    RestDefaults.extendModel('sounds', function(model) {
      model.audiofileUrl = function() {
        return ENV.assetsUrl + this.audiofile;
      };

      return model;
    });

    return RestDefaults.service('sounds');
  })

  .factory('Artists', function(RestDefaults, ENV) {
    RestDefaults.extendModel('artists', function(model) {
      model.headshotUrl = function() {
        return ENV.assetsUrl + this.headshot;
      };
      return model;
    });

    return RestDefaults.service('artists');
  });

;