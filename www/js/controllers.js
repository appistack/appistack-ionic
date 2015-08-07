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

  .controller('UsersCtrl', function ($scope, users) {
    $scope.users = users;
  })

  .controller('UserDetailCtrl', function($scope, user) {
    $scope.user = user;
  })

  .controller('UserEditCtrl', function($scope, user, $state) {
    $scope.user = user;
    $scope.submit = function() {
      $scope.user.save().then(function(res) {
        $state.go('app.user', {id: $scope.user.id});
      });
    };
  })

  .controller('ArtistsCtrl', function ($scope, artists) {
    $scope.artists = artists;
  })


  /* yeh, this controller is way too big, i know. i'm not going to use this code. */
  .controller('ArtistDetailCtrl', function ($scope, $q, artist, audio, mic, SpectroOpts, SpectroAnimations, SpectroSimilarity) {
    $scope.artist = artist;
    $scope.sound = artist.sounds[0];

    var canvas = document.getElementById('spectrogram-canvas'),
      draw = canvas.getContext('2d'),
      audioTag = document.getElementById('spectrogram-audio');

    var freqRange = SpectroOpts.FREQ_RANGE;
    var decRange = SpectroOpts.DEC_RANGE;
    var audioContext = new window.AudioContext();
    var sx, sy;
    var specSim = SpectroSimilarity;

    // need these on scope, so i can switch to factory later,
    //   but still share values to sub-controllers
    audio.audio = audioTag;
    audio.initAudioGraph(audioContext);

    mic.initMic(audioContext, function (stream) {
      var defer = $q.defer();
      defer.promise
        .then(function () {
          mic.initMicGraph(stream);
        }).then(function () {
          animate();
        });

      defer.resolve();
    });

    var countdownStart;
    var recordStarttime, recordEndtime;
    $scope.state = 'initCanvas';
    var states = {
      initCanvas: {
        runOnce: true,
        renderOnce: true,
        ran: false,
        rendered: false,
        run: function () {
          //set canvas dimensions
          sx = canvas.width = canvas.offsetWidth;
          sy = canvas.height = canvas.offsetHeight;
        },
        render: function (results) {
          draw.clearRect(0, 0, sx, sy);
          $scope.state = 'loaded';
        }
      },
      loaded: {
        runOnce: false,
        ran: false,
        renderOnce: false,
        rendered: false,
        run: function () { },
        render: function (results) {
          var waveData = new Uint8Array(mic.analyzer.frequencyBinCount);
          mic.analyzer.getByteTimeDomainData(waveData);
          draw.clearRect(0, 0, sx, sy);
          drawWaveform(waveData);
        }
      },
      playing: {
        runOnce: true,
        ran: false,
        renderOnce: false,
        rendered: false,
        run: function () {
          audio.setupSpectrogram();
          audio.connectSourceToGraph(audio.context.createBufferSource());
          audio.isPlaying = true;
          audio.source.start();
        },
        render: function (results) {
          var waveData = new Uint8Array(audio.analyzer.frequencyBinCount);
          audio.analyzer.getByteTimeDomainData(waveData);
          if (audio.spectrogramLoaded) { $scope.state = 'played'; }
          draw.clearRect(0, 0, sx, sy);
          drawWaveform(waveData);
        }
      },
      played: {
        runOnce: true,
        ran: false,
        renderOnce: true,
        rendered: false,
        run: function () {
          initD3();
          //var min = d3.min(audio.data, function(d) { return d3.min(d.values); });
          var max = d3.max(audio.data, function(d) { return d3.max(d.values); });
          zScale.domain([SpectroOpts.DEC_RANGE[0], max - 10]);
        },
        render: function (results) {
          draw.clearRect(0, 0, sx, sy);
          drawSpectrogram(audio.data);
          audio.image = draw.getImageData(0,0,sx,sy);
        }
      },
      countdown: {
        runOnce: true,
        ran: false,
        renderOnce: false,
        rendered: false,
        run: function () {
          countdownStart = new Date().getTime();
          draw.font = 'italic 72px Arial';
          draw.textAlign = 'center';
          draw.textBaseline = 'middle';
          draw.fillStyle = 'black';
          mic.resetRecording(audio.duration);
        },
        render: function () {
          var msElapsed = ((new Date()).getTime() - countdownStart),
            secondsRemaining = (3 - Math.floor(msElapsed / 1000));
          draw.clearRect(0, 0, sx, sy);
          draw.putImageData(audio.image, 0,0);
          draw.fillText(secondsRemaining.toString(), sx/2, sy/2);
          draw.fillRect(0,0,(msElapsed/3000)*sx, 16);
          draw.fillRect(sx-(msElapsed/3000)*sx,sy-16,(msElapsed/3000)*sx, 16);
          if (msElapsed > 3000) {
            $scope.state = 'recording';
          }
        }
      },
      recording: {
        runOnce: true,
        ran: false,
        renderOnce: false,
        rendered: false,
        run: function () {
          mic.isRecording = true;
          recordStarttime = new Date().getTime();
          recordEndtime = recordStarttime + (audio.duration * 1000);
        },
        render: function () {
          var waveData = new Uint8Array(mic.analyzer.frequencyBinCount);
          var timeNow = (new Date()).getTime(),
            msElapsed = timeNow - recordStarttime;
          mic.analyzer.getByteTimeDomainData(waveData);
          draw.clearRect(0, 0, sx, sy);
          draw.putImageData(audio.image,0,0);
          drawPositionBar(sx * (msElapsed/audio.duration) / 1000);
          drawWaveform(waveData);
          if (timeNow > recordEndtime) {
            $scope.state = 'recorded';
          }
        }
      },
      recorded: {
        runOnce: true,
        ran: false,
        renderOnce: true,
        rendered: false,
        run: function () {
          //initD3();
          //var min = d3.min(audio.data, function(d) { return d3.min(d.values); });
          //var max = d3.max(audio.data, function(d) { return d3.max(d.values); });
          //zScale.domain([SpectroOpts.DEC_RANGE[0], max - 10]);
        },
        render: function () {
          draw.clearRect(0, 0, sx, sy);
          drawSpectrogram(mic.data);
          mic.image = draw.getImageData(0,0,sx,sy);
        }
        //display both sound samples
        // allow for drag and
      },
      scoring: {
        runOnce: true,
        ran: false,
        renderOnce: true,
        rendered: false,
        run: function () {
          var newImg = draw.getImageData(0,0,sx,sy);
          specSim.diffImages(audio.image, mic.image, newImg, 0); // drag'n'drop /w $scope.scoreXOffset
          return {newImg:newImg};
        },
        render: function (results) {
          draw.clearRect(0, 0, sx, sy);
          draw.putImageData(results.newImg, 0,0);
          $scope.state = 'scored';
        }
      },
      scored: {
        runOnce: true,
        ran: false,
        renderOnce: true,
        rendered: false,
        run: function () {
          $scope.sampleScore = specSim.score(audio.image, mic.image, 0) * 100;
        },
        render: function () {

        }
      },
      submitting: {
        runOnce: true,
        ran: false,
        renderOnce: true,
        rendered: false,
        run: function () {

        },
        render: function () {

        }
      },
      submitted: {}
    };

    var animate = function () {
      //TODO: bad idea to use defer in animate block?
      var defer = $q.defer();
      defer.promise
        .then(function () {
          if (!(states[$scope.state].runOnce && states[$scope.state].ran)) {
            states[$scope.state].ran = true; //TODO: make this happen after run() - drawing spectrogram is too slow
            var result = states[$scope.state].run();
            return result;
          }
        })
        .then(function (result) {
          if (!(states[$scope.state].renderOnce && states[$scope.state].rendered)) {
            states[$scope.state].rendered = true; //TODO: make this happen after render()
            states[$scope.state].render(result);
          }
        })
        .then(function (result) {
          requestAnimationFrame(animate);
        });
      defer.resolve();
    };

    var drawWaveform = function (data) {
      SpectroAnimations.drawWaveform(draw, sx, sy, data);
    };

    var drawPositionBar = function (x) {
      SpectroAnimations.drawPositionBar(draw, x, sy);
    };

    var drawSpectrogram = function (data) {
      SpectroAnimations.drawSpectrogram(draw, sx, sy, xScale, yScale, zScale, audio.maxCount, audio.analyzer.frequencyBinCount, audio.nyquist, data);
    };

    $scope.$watch(
      function (scope) {
        return scope.state;
      },
      function (newVal,oldVal) {
        $scope.playEnabled = (newVal == 'loaded' || newVal == 'played' || newVal == 'recorded' || newVal == 'scored');
        $scope.recordEnabled = (newVal == 'played' || newVal == 'recorded');
        $scope.scoreEnabled = (newVal == 'recorded' || newVal == 'submitted');
        $scope.submitEnabled = false; //(newVal == 'scored');
      });

    var xScale, yScale, zScale;
    var initD3 = function () {
      xScale = d3.scale.linear().domain([0, audio.duration]).range([0, sx]);
      yScale = d3.scale.linear().domain(freqRange).range([0, sy]);
      zScale = d3.scale.linear().domain(decRange).range(["white", "blue"]).interpolate(d3.interpolateLab);
    };

    $scope.reset = function (state) {
      states[state].ran = false;
      states[state].rendered = false;
    };

    $scope.play = function () {
      $scope.reset('playing');
      $scope.reset('played');
      $scope.state = 'playing';
    };

    $scope.record = function () {
      $scope.reset('countdown');
      $scope.reset('recording');
      $scope.reset('recorded');
      $scope.state = 'countdown';
    };

    $scope.score = function () {
      $scope.reset('scoring');
      $scope.reset('scored');
      $scope.state = 'scoring';
      //$scope.$apply(); //TODO: figure out why state transitions aren't working without $scope.$digest
    };

    $scope.submit = function () {
      $scope.state = 'submitting';
    };

    audio.src = $scope.sound.audiofile;
    audio.loadAudio();
  });
