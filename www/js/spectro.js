angular.module('appistack.spectro', [])
  .constant('SpectroOpts', {
    FREQ_RANGE: [20, 8000],
    DEC_RANGE: [0, 60]
  })

  .factory('SpectroAnimations', function (SpectroOpts) {
    return {
      drawWaveform: function (drawContext, sx, sy, data) {
        var barWidth = sx / data.length;
        drawContext.strokeStyle = '#000000';
        drawContext.beginPath();
        drawContext.moveTo(0,sy/2);

        for (var i = 0; i < data.length; i++) {
          var height = sy * (data[i] / 256); //TODO: abstract 256
          var y = sy - height - 1;
          var xWidth = sx / data.length;
          drawContext.lineTo(i * xWidth, y);
        }
        drawContext.stroke();
      },

      drawPositionBar: function (drawContext, x, sy) {
        drawContext.strokeStyle = '#FF0000';
        drawContext.beginPath();
        drawContext.moveTo(x,0);
        drawContext.lineTo(x,sy);
        drawContext.stroke();
      },

      drawSpectrogram: function (drawContext, sx, sy, xScale, yScale, zScale, maxCount, nfreq, nyquist, data) {
        var dotWidth = sx / maxCount;
        var dotHeight = sy / maxCount;

        data.forEach(function(d) {
          for (var i = 0; i < d.values.length + 1; i++) {
            var v = d.values[i];
            var x = xScale(d.key);
            var binFrequency = (i / nfreq) * nyquist;
            var y = yScale(binFrequency);

            drawContext.fillStyle = zScale(v);
            drawContext.fillRect(x,sy-y, dotWidth, dotHeight);
          }
        });
      }
    };
  })

  .factory('SpectroSimilarity', function () {
    var similarity = {};

    similarity.diffImages = function (audioImg, micImg, newImg, xOffset) {
      for (var i=0; i<audioImg.data.length/4; i++) {
        newImg.data[i*4] = audioImg.data[i*4];
        newImg.data[i*4+1] = micImg.data[i*4];
      }

      return newImg;
    };

    similarity.score = function (audioImg, micImg, xOffset) {
      var totalScore = 0,
        totalPossibleScore = 0;

      //world's simplist similarity algorithm
      for (var i=0; i<audioImg.data.length; i++) {
        var totalVal = 512, // 256 per img
          audioVal = audioImg.data[i*4] || 0,
          micVal = micImg.data[i*4] || 0,
          combinedVal = audioVal + micVal + 1, //TODO: +1 (fixes div by zero)
          possibleScore = (combinedVal/totalVal),
          score = (combinedVal/totalVal)*(Math.abs(audioVal-micVal)/combinedVal);

        totalScore += score;
        totalPossibleScore += possibleScore;
      }

      return totalScore/totalPossibleScore;
    };

    return similarity;
  })

  .service('SpectroAudio', function (ENV) {
    var sa = this;

    //handles state of audio and audio images
    this.sampleRate = 512;
    this.sampleCount = 0;
    this.curSec = 0;
    this.data = [];
    this.isPlaying = false;
    this.spectrogramLoaded = false;
    this.loaded = false;

    this.initAudioGraph = function (audioContext) {
      sa.context = audioContext;
      sa.analyzer = sa.context.createAnalyser();
      sa.analyzer.fftsize = 2048;
      sa.nyquist = sa.context.sampleRate/2;
      sa.scriptProcessor = sa.context.createScriptProcessor(sa.sampleRate, 1, 1);
      sa.scriptProcessor.onaudioprocess = sa.audioProcess;
      sa.analyzer.connect(sa.scriptProcessor);
      sa.scriptProcessor.connect(sa.context.destination);
    };

    this.requestAudio = function (cb) {
      if (!sa.loaded) {
        var req = new XMLHttpRequest();
        req.open("GET", ENV.assetsUrl + sa.src, true);
        req.responseType = "arraybuffer";

        req.onload = function () {
          sa.context.decodeAudioData(req.response, function (buffer) {
            if (!buffer) {
              console.error('error decoding file data: ' + url);
              return;
            }
            cb(buffer);
            sa.loaded = true;
          }, function (e) {
            console.error('decodeAudioData error', e);
          });
        };
        req.onerror = function () {
          console.error('BufferLoader: XHR error');
        };
        req.send();
      }
    };

    this.loadAudio = function () {
      //TODO: move requestAudio content here?
      sa.requestAudio(function (buffer) {
        sa.buffer = buffer;
      });
    };

    this.connectSourceToGraph = function(source) {
      sa.source = source;
      sa.source.buffer = sa.buffer;
      sa.source.connect(sa.analyzer);
      sa.source.connect(sa.context.destination);
      sa.duration = sa.source.buffer.duration;
      sa.maxCount = (sa.context.sampleRate/sa.sampleRate) * sa.duration;
    };

    this.setupSpectrogram = function () {
      sa.data = [];
      sa.curSec = 0;
      sa.sampleCount = 0;
      sa.spectrogramLoaded = false;
    };

    this.audioProcess = function (e) {
      if (sa.isPlaying && !sa.spectrogramLoaded) {
        sa.sampleCount += 1;
        sa.curSec = (sa.sampleRate * sa.sampleCount) / sa.context.sampleRate;

        sa.freqs = new Uint8Array(sa.analyzer.frequencyBinCount);
        sa.analyzer.getByteFrequencyData(sa.freqs);

        //TODO: push to array were audio data is preserved
        sa.data.push({key: sa.curSec, values: new Uint8Array(sa.freqs)});
        if (sa.sampleCount >= sa.maxCount) {
          sa.spectrogramLoaded = true;
        }
      }
    };

    this.getBinFrequency = function (i) {
      return i / SpectrogramAudio.freqs.length * SpectrogramAudio.nyquist;
    };
  })

  .service('SpectroMic', function () {
    var sm = this;

    this.loaded = false;
    this.sampleRate = 512;
    this.curSec = 0;
    this.data = [];
    this.isRecording = false;
    this.spectrogramLoaded = false;

    this.initMicGraph = function(stream) {
      sm.micInput = sm.context.createMediaStreamSource(stream);
      sm.analyzer = sm.context.createAnalyser();
      sm.analyzer.smoothingTimeConstant = 0;
      sm.analyzer.fftSize = 2048;
      sm.nyquist = sm.context.sampleRate/2;
      sm.scriptProcessor = sm.context.createScriptProcessor(sm.sampleRate, 1, 1);
      sm.scriptProcessor.onaudioprocess = sm.audioProcess;

      sm.micInput.connect(sm.analyzer);
      sm.analyzer.connect(sm.scriptProcessor);
      sm.scriptProcessor.connect(sm.context.destination);
      sm.loaded = true;
    };

    this.initMicError = function(e) {
      console.error('Error initializing microphone', e);
    };

    this.audioProcess = function (e) {
      if (sm.isRecording && !sm.spectrogramLoaded) {
        sm.sampleCount += 1;
        sm.curSec = (sm.sampleRate * sm.sampleCount) / sm.context.sampleRate;
        sm.freqs = new Uint8Array(sm.analyzer.frequencyBinCount);
        sm.analyzer.getByteFrequencyData(sm.freqs);
        sm.data.push({key: sm.curSec, values: new Uint8Array(sm.freqs)});
        if (sm.sampleCount >= sm.maxCount) {
          sm.spectrogramLoaded = true;
        }
      }
    };

    this.initMic = function (audioContext, cb) {
      sm.context = audioContext;
      navigator.getUserMedia({audio: true}, cb, sm.initMicError);
    };

    this.resetRecording = function (duration) {
      sm.data = [];
      sm.sampleCount = 0;
      sm.maxCount = (sm.context.sampleRate/sm.sampleRate) * duration;
      sm.isRecording = false;
      sm.spectrogramLoaded = false;
    };
  })

  .service('MicService', function () {
    var ms = this;

    this.initMic = function (audioContext, cb) {

    };
  });
