/* global debounce,
* requestFullscreen,
* touchHover
*/

// when 'ready' event's fired:
// element.playMedia() for playing/showing it
// element.pauseMedia() to pause/hide it
// 'ended' event will be fired

/*
* @description
* 
* This class create media content and expose methods to control them
*
* @param {string|string[]|Object|Object[]} media - a media URL, an Array of these, a configurationObject or an Array of those
*
* @param {Object} configurationObject - contains media configuration information
* 
* @param {string|string[]|Object} configurationObject.uri - a media URL, an external video id or an Array of those
* @param {string} [configurationObject.provider] - the media provider from : ('vimeo'|'youtube'|'video'|'picture')
* @param {string} [configurationObject.name] - a media's name to be displayed
* @param {Object} [configurationObject.options] - an Object containing options relative to the media's provider
*
* @param {bool} [configurationObject.options.muted=false]
* @param {string} [configurationObject.options.preload='auto'] - ('none'|'metadata'|'auto')
* @param {bool} [configurationObject.options.noload=false] - don't load media
* @param {string} [configurationObject.options.poster] - URI to poster
* @param {number} [configurationObject.options.default=0] - index of default source in configurationObject.uri
*
* @param {number} [configurationObject.options.api=1] - enable API
* @param {number} [configurationObject.options.rel=0]
* @param {number} [configurationObject.options.showinfo=0]
* @param {string} [configurationObject.options.color='white']
* @param {number} [configurationObject.options.ivLoadPolicy=3]
* @param {number} [configurationObject.options.disablekb=1]
* @param {number} [configurationObject.options.ccLoadPolicy=0]
*
* @param {number} [configurationObject.options.api=1] - enable API
* @param {number} [configurationObject.options.title=0]
* @param {number} [configurationObject.options.portrait=0]
* @param {string} [configurationObject.options.color='f0f0f0']
* @param {number} [configurationObject.options.byline=0]
* @param {number} [configurationObject.options.badge=0]
*/
var mediaLibJS = function(media) {
  var uri,
    provider,
    
  // init Events
    mediaReady = document.createEvent('Event'),
    mediaEnded = document.createEvent('Event'),
    mediaPaused = document.createEvent('Event');
  mediaReady.initEvent('ready', true, true),
    mediaEnded.initEvent('ended', true, true),
    mediaPaused.initEvent('paused', true, true);
    
  // get URI
  if(typeof media === "string") uri = media;
  else if(media.uri) uri = media.uri;
  
  // get provider
  provider = media.provider || getProvider(uri);
  function getProvider(uri){
    uri = uri.toLowerCase();
    // video
    if(/\.(mp4|webm|ogv)$/.test(uri)) return 'video';
    if(/\.(jpg|jpeg|png|gif|svg)$/.test(uri)) return 'picture';
    // external URI
    if(/^http:\/\//.test(uri)){
      var domain = uri.split('/')[2];
      if(/vimeo/.test(domain)) return 'vimeo';
      else if (/(youtube|youtu\.be)/.test(domain)) return 'youtube';
    }
    return false;
  }
  
};
var gallery = function(media){
  var galleryElement = this.element = document.createElement('div');
      var controls = document.createElement('div'),
        next = document.createElement('div'),
        previous = document.createElement('div');
      var slides = [];
      galleryElement.className = 'gallery';
      controls.className = 'controls';
      next.className = 'next';
      controls.appendChild(next);
      previous.className = 'previous hidden';
      controls.appendChild(previous);
      galleryElement.appendChild(controls);

      // Slides
      var loading,
        name = document.createElement('div');
      name.className = "name";
      for (var i = 0; i < media.slides.length; i++) {
        var slide = media.slides[i],
          slideElement = slides[i] = document.createElement('div');
        slideElement.className = i + ' slide';
        slideElement.loadEventType = 'load';
        switch (slide.dataType) {
          case "extVideo":
            var slideMedia = new mediaLibJS[slide.dataType](slide.media);
            slideElement.loadEventType = 'ready';
            slideElement.preload = slideMedia.element;
            slideElement.appendChild(slideMedia.element);
            slideElement.media = slideMedia.element;
            break;
          case "intVideo":
            slideElement.classList.add('flex-wrapper');
            slideMedia = new mediaLibJS[slide.dataType](slide.media);
            var slidePosterSrc = slideMedia.videoElement.getAttribute('poster');
            if(slidePosterSrc){
              slideElement.preload = new Image();
              slideElement.preload.src = slidePosterSrc;
            } else {
              slideElement.preload = slideMedia.videoElement;
            }
            slideElement.appendChild(slideMedia.element);
            slideElement.media = slideMedia.element;
            break;
          case "picture":
          default:
            // Consider slide dataType as picture
            var slideSrc = slide.src;
            slideElement.preload = new Image();
            slideElement.preload.src = slideSrc;
            slideElement.style['background-image'] = "url('" + slideSrc + "')";
            slideElement.addEventListener('click', nextSlide);
            // create media dummy
            slideElement.media = { pauseMedia: function(){ return}};
        }
        // block slideMedia's event propagation
        if(slideMedia.element) slideMedia.element.addEventListener('ended', function(event){
          event.stopPropagation();
        });
        slideElement.preload.addEventListener(slideElement.loadEventType, function(event) {
          if(slides.indexOf(this) != 0) event.stopPropagation();
          this.loaded = true;
        }.bind(slideElement));
        if (slide.name) {
          name.textContent = slide.name;
          slideElement.nameElement = name.cloneNode(true);
          slideElement.appendChild(slideElement.nameElement);
        }
        galleryElement.appendChild(slideElement);
      }
      
      // First slide will be showed
      slides[0].classList.add('selected');
      var selectedSlideIndex = 0;
      if(slides[0].loadEventType == 'load') slides[0].preload.addEventListener('load', function(event) {
        galleryElement.dispatchEvent(mediaReady);
      });
      //Navigation
      var timer = 0;

      function toggleControls() {
        controls.classList.remove('hidden');
        slides[selectedSlideIndex].nameElement.classList.remove('hidden');
        if (timer) {
          window.clearTimeout(timer);
        }
        timer = window.setTimeout(function() {
          controls.classList.add('hidden');
          slides[selectedSlideIndex].nameElement.classList.add('hidden');
        }, 2000);
      }

      function keyboardControls(event) {
        event.stopImmediatePropagation();
        switch (event.key) {
          case " ":
          case "ArrowUp":
          case "ArrowRight":
            nextSlide();
            break;
          case "ArrowDown":
          case "ArrowLeft":
            previousSlide();
            break;
          case "Escape":
            galleryElement.pauseMedia();
            break;
        }
      }

      function loadedSlide(event) {
        if (event) selectSlide(loading);
        slides[loading].preload.removeEventListener(slides[loading].loadEventType, loadedSlide);
        loading = null;
        document.body.classList.remove('progress');
      }

      function previousSlide() {
        var index = selectedSlideIndex - 1;
        if (loading) {
          if (loading == index){
            // Already loading, load anyway
            loadedSlide(true);
            return;
          }else loadedSlide();
        }
        switch (index) {
          case 0:
            previous.classList.add('hidden');
            break;
          case (-1):
            index = 0;
            return false;
        }
        if (slides[index].loaded) selectSlide(index);
        else {
          loading = index;
          document.body.classList.add('progress');
          slides[index].preload.addEventListener(slides[index].loadEventType, loadedSlide);
        }
      }

      function nextSlide() {
        toggleControls();
        var index = selectedSlideIndex + 1;
        if (loading) {
          if (loading == index){
            // Already loading, load anyway
            loadedSlide(true);
            return;
          }else loadedSlide();
        }
        switch (index) {
          case 1:
            break;
          case (slides.length):
            index = 0;
          case 0:
            
            break;
        }
        if (slides[index].loaded) selectSlide(index);
        else {
          loading = index;
          slides[index].preload.addEventListener(slides[index].loadEventType, loadedSlide);
        }
      }

      function selectSlide(index) {
        switch (index) {
          case 1:
            previous.classList.remove('hidden');
            break;
          case 0:
            previous.classList.add('hidden');
            break;
          case (slides.length - 2):
            next.classList.remove('hidden');
            break;
        }
        slides[selectedSlideIndex].classList.remove('selected');
        slides[selectedSlideIndex].media.pauseMedia();
        slides[index].classList.add('selected');
        selectedSlideIndex = index;
        toggleControls();
      }
      next.addEventListener('click', nextSlide);
      previous.addEventListener('click', previousSlide);
      touchHover(controls);
      galleryElement.addEventListener('mousemove', debounce(toggleControls, 20));
      galleryElement.playMedia = function() {
        window.addEventListener('keypress', keyboardControls);
      };
      galleryElement.pauseMedia = function() {
        window.removeEventListener('keypress', this.keyboardControls);
        galleryElement.dispatchEvent(mediaPaused);
        slides[selectedSlideIndex].media.pauseMedia();
      };
}
var intVideo = function(media){
  // media object configuration exemple :
      // media = {
      //   sources: QHD:{
      //       name:"QHD+",
      //       width:3200,
      //       height:1200,
      //       tracks:[{
      //         src:"path/to/video.extension",
      //         type:"video/extension"
      //       }]
      //     },
      //   poster: "path/to/poster.jpg",
      //   preload: "auto",
      //   default: "QHD"
      // };
      var div = document.createElement('div'),
        player = this,
        intVideoElement = this.element = div.cloneNode(),


        // Video intVideoElement
        videoElement = this.videoElement = document.createElement('video');
      videoElement.setAttribute('webkitallowfullscreen', '');
      videoElement.setAttribute('allowfullscreen', '');
      videoElement.setAttribute('muted', media.muted || false);
      videoElement.setAttribute('preload', media.preload || 'auto');
      if(media.poster) videoElement.setAttribute('poster', media.poster);
      intVideoElement.className = "int-video";
      
      // Sources
      var sourceElement = document.createElement('source'),
      loaderTimeOutID;
      function changeSource(sourceName){
        var source = media.sources[sourceName || media.default || Object.keys(media.sources)[0]],
          track,
          currentTime = videoElement.currentTime;
        if(!videoElement.paused) play();
        window.clearTimeout(loaderTimeOutID);
        // wipe previous
        videoElement.innerHTML = '';
        for (var i = source.tracks.length - 1; i >= 0; i--) {
          track = source.tracks[i];
          sourceElement.setAttribute('type', track.type);
          sourceElement.setAttribute('src', track.src);
          videoElement.appendChild(sourceElement.cloneNode());
        }
        videoElement.load();
        videoElement.currentTime = currentTime;
        loader();
        var previouslySelectedList = qualitySelectorElement.getElementsByClassName('selected');
        for( i = 0; i<previouslySelectedList.length; i++) previouslySelectedList[i].classList.remove('selected');
        source.element.classList.add('selected');
      }
      intVideoElement.appendChild(videoElement);
      
      // Controls
      var controlsElement = div.cloneNode(),
        controlsLeftElement = div.cloneNode();
      controlsElement.classList.add('controls');
      controlsLeftElement.classList.add('controls-left');
      intVideoElement.appendChild(controlsElement);
      controlsElement.appendChild(controlsLeftElement);

      // ProgressBar
      var progressBarElement = div.cloneNode(),
        loadedElement = div.cloneNode(),
        seekElement = div.cloneNode(),
        playedElement = div.cloneNode(),
        timeElement = div.cloneNode(),
        durationElement = div.cloneNode(),
        currentTimeElement = div.cloneNode();
      progressBarElement.classList.add('progress-bar');
      loadedElement.classList.add('loaded');
      seekElement.classList.add('seek');
      playedElement.classList.add('played'),
        timeElement.classList.add('time'),
        durationElement.classList.add('duration'),
        currentTimeElement.classList.add('current-time');
      controlsElement.appendChild(progressBarElement);
      progressBarElement.appendChild(loadedElement);
      progressBarElement.appendChild(seekElement);
      progressBarElement.appendChild(playedElement);
      timeElement.appendChild(currentTimeElement);
      timeElement.appendChild(durationElement);

      //Seeked
      function showSeek(event) {
        var progressBarRect = progressBarElement.getBoundingClientRect(),
          positionInBar = event.clientX - progressBarRect['left'];
        seekElement.style.width = positionInBar + 'px';
        currentTimeElement.textContent = displayTime(videoElement.duration * positionInBar / progressBarRect['width']);
      }
      progressBarElement.addEventListener('mousemove', debounce(showSeek, 10));

      function hideSeek() {
        seekElement.style.width = '0px';
        currentTimeElement.textContent = displayTime(videoElement.currentTime);
      }
      progressBarElement.addEventListener('mouseleave', hideSeek);

      function onSeek(event) {
        window.addEventListener('mousemove', seeking);
        window.addEventListener('mouseup', seeked);
        intVideoElement.classList.add('grabbing');
        pause();
      }

      function seeking(event) {
        var progressBarRect = progressBarElement.getBoundingClientRect(),
          positionInBar = event.clientX - progressBarRect['left'];
        if (positionInBar < 0) videoElement.currentTime = 0;
        else if (positionInBar > progressBarRect['width']) videoElement.currentTime = videoElement.duration - 0.01;
        else videoElement.currentTime = videoElement.duration * positionInBar / progressBarRect['width'];
      }

      function seeked() {
        window.removeEventListener('mousemove', seeking);
        window.removeEventListener('mouseup', seeked);
        intVideoElement.classList.remove('grabbing');
        play();
      }
      progressBarElement.addEventListener('mousedown', onSeek);
      progressBarElement.addEventListener('click', seeking);

      // Played
      function onTimeUpdate() {
        playedElement.style.width = this.played = (videoElement.currentTime / videoElement.duration) * 100 + '%';
        currentTimeElement.textContent = displayTime(videoElement.currentTime);
      }
      videoElement.addEventListener('timeupdate', onTimeUpdate);

      // Time display
      function displayTime(seconds) {
        function twoDigits(int) {
          if (int < 9) int = '0' + int;
          return int;
        }
        var minutes = Math.floor(seconds / 60);
        seconds = twoDigits(Math.floor(seconds % 60));
        if (minutes > 60) {
          minutes = Math.floor(minutes / 60) + ':' + twoDigits(Math.floor(minutes % 60));
        }
        return minutes + ':' + seconds;
      }

      // Play pause

      var playElement = div.cloneNode();
      playElement.classList.add('play','paused');
      controlsLeftElement.appendChild(playElement);

      function play() {
        playElement.classList.remove('paused');
        controlsElement.classList.remove('stay');
        videoElement.play();
      }

      function pause() {
        playElement.classList.add('paused');
        controlsElement.classList.add('stay');
        videoElement.pause();
      }

      function togglePlay() {
        toggleControls();
        if (videoElement.paused) play();
        else pause();
      }
      videoElement.addEventListener('click', togglePlay);
      playElement.addEventListener('click', togglePlay);

      // Volume
      var volumeElement = div.cloneNode(),
        volumeLogoElement = div.cloneNode(),
        volumeBarElement = div.cloneNode(),
        volumeLevelElement = div.cloneNode();
      volumeElement.classList.add('volume');
      volumeLogoElement.classList.add('volume-logo');
      volumeBarElement.classList.add('volume-bar');
      volumeLevelElement.classList.add('volume-level');
      controlsLeftElement.appendChild(volumeElement);
      volumeElement.appendChild(volumeLogoElement);
      volumeElement.appendChild(volumeBarElement);
      volumeBarElement.appendChild(volumeLevelElement);

      // Bar
      function onVolumeChange(event) {
        window.addEventListener('mousemove', volumeChanging);
        window.addEventListener('mouseup', volumeChanged);
        volumeElement.classList.add('active');
        intVideoElement.classList.add('grabbing');
      }

      function volumeChanging(arg) {
        var newVolume;
        if (arg.clientX) {
          var VolumeBarRect = volumeBarElement.getBoundingClientRect();
          newVolume = (arg.clientX - VolumeBarRect['left']) / VolumeBarRect['width'];
        }
        else {
          newVolume = videoElement.volume + arg;
        }
        if (newVolume < 0) videoElement.volume = 0;
        else if (newVolume > 1) videoElement.volume = 1;
        else videoElement.volume = newVolume;
        if (videoElement.muted && newVolume > 0) toggleMute();
        else if (newVolume <= 0) volumeElement.classList.add('muted');
        else if (volumeElement.classList.contains('muted')) volumeElement.classList.remove('muted');
        volumeLevelElement.style.width = videoElement.volume * 100 + '%';
      }

      function volumeChanged() {
        window.removeEventListener('mousemove', volumeChanging);
        window.removeEventListener('mouseup', volumeChanged);
        volumeElement.classList.remove('active');
        intVideoElement.classList.remove('grabbing');
      }
      volumeBarElement.addEventListener('mousedown', onVolumeChange);
      volumeBarElement.addEventListener('click', volumeChanging);

      // Mute
      function toggleMute() {
        if (videoElement.muted) {
          videoElement.muted = false;
          volumeElement.classList.remove('muted');
        }
        else {
          videoElement.muted = true;
          volumeElement.classList.add('muted');
        }
      }
      volumeLogoElement.addEventListener('click', toggleMute);
      controlsLeftElement.appendChild(timeElement);
      
      // Quality selector
      var qualitySelectorElement = div.cloneNode(),
      qualitiesElement = div.cloneNode();
      qualitySelectorElement.classList.add('quality-selector');
      qualitiesElement.className = 'qualities';
      qualitySelectorElement.appendChild(qualitiesElement);
      controlsElement.appendChild(qualitySelectorElement);
      for(var i in media.sources){
        // We have to use a wrapper to create a fresh qualityElement each time
        (function(sourceName){
          var qualityElement = div.cloneNode();
          qualityElement.classList.add('quality');
          // reference of element to select it on sourceChange
          qualityElement.textContent = media.sources[sourceName].name;
          media.sources[sourceName].element = qualityElement;
          qualityElement.addEventListener('click', function(){
            if(!this.classList.contains('selected')){
              changeSource(sourceName);
              videoElement.addEventListener(function(){
                play();
                videoElement.removeEventListener('changeSource');
              },'changeSource');
            }
          });
          qualitiesElement.appendChild(qualityElement);
        }(i));
      }
      
      // Fullscreen
      var fullscreenElement = div.cloneNode();
      fullscreenElement.classList.add('fullscreen');
      controlsElement.appendChild(fullscreenElement);

      var requestFullscreen = function() {
        if (document.documentElement.requestFullscreen) {
          return function(intVideoElement) {
            intVideoElement.requestFullscreen();
          };
        }
        else if (document.documentElement.msRequestFullscreen) {
          return function(intVideoElement) {
            intVideoElement.msRequestFullscreen();
          };
        }
        else if (document.documentElement.mozRequestFullScreen) {
          return function(intVideoElement) {
            intVideoElement.mozRequestFullScreen();
          };
        }
        else if (document.documentElement.webkitRequestFullscreen) {
          return function(intVideoElement) {
            intVideoElement.webkitRequestFullscreen(intVideoElement.ALLOW_KEYBOARD_INPUT);
          };
        }
      }();
      document.exitFullscreen = function() {
        return (document.exitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen);
      }();

      function onFullscreen() {
        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
          fullscreenElement.classList.add('full');
          requestFullscreen(intVideoElement);
        }
        else {
          fullscreenElement.classList.remove('full');
          document.exitFullscreen();
        }
      }

      function onFullscreenExit() {
        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) fullscreenElement.classList.remove('full');
      }
      videoElement.addEventListener('dblclick', onFullscreen);
      fullscreenElement.addEventListener('click', onFullscreen);

      function keyboardControls(event) {
        event.stopImmediatePropagation();
        toggleControls();
        switch (event.key) {
          case " ":
            togglePlay();
            event.preventDefault();
            break;
          case "Escape":
            intVideoElement.pauseMedia();
            videoElement.dispatchEvent(mediaPaused);
            break;
          case "m":
            toggleMute();
            break;
          case "f":
            onFullscreen();
            break;
          case "ArrowUp":
            volumeChanging(0.05);
            event.preventDefault();
            break;
          case "ArrowDown":
            volumeChanging(-0.05);
            event.preventDefault();
            break;
          case "ArrowLeft":
            if (videoElement.currentTime >= 1) videoElement.currentTime -= 1;
            break;
          case "ArrowRight":
            if (videoElement.currentTime < videoElement.duration - 1) videoElement.currentTime += 1;
            break;
        }
      }

      // Simple loading interface attaching a value ]0,1] as 1 is canplaythrought and 0 is havenothing and triggering a 'loading' event on the intVideoElement
      var intVideoLoading = document.createEvent('Event'),
        canplay = document.createEvent('Event'),
        previousProgress = 0,
        fourCount = 0,
        time = 500;
      intVideoLoading.initEvent('loading', true, true);
      canplay.initEvent('canplay', true, true);

      function loader() {
        switch (videoElement.readyState) {
          case 2:
          case 3:
            var progress = videoElement.buffered.length>=1 ? videoElement.buffered.end(videoElement.buffered.length - 1) : 0;
          case 0:
          case 1:
            intVideoElement.loaded = (progress) ? (progress * (1 + (progress - previousProgress) / time) / videoElement.duration) : 0;
            intVideoElement.dispatchEvent(intVideoLoading);
            previousProgress = progress || previousProgress;
            fourCount = 0;
            break;
          case 4:
            // in case there is 3 consecutive readyState 4 or loaded near the end
            if (intVideoElement.loaded > 0.9 || fourCount >= 2) {
              intVideoElement.loaded = 1;
              videoElement.dispatchEvent(mediaReady);
              return;
            }
            else fourCount += 1;
        }
        loaderTimeOutID = window.setTimeout(loader, time);
      }
      
      // start loading except if specicified
      if(!media.noload) changeSource();
      // expose two methods to control the loading
      intVideoElement.loadMedia = changeSource;
      intVideoElement.stopMedia = function(){
        if(!videoElement.paused) play();
        window.clearTimeout(loaderTimeOutID);
        videoElement.innerHTML = '<source src="about:blank">';
        videoElement.load();
      };
      
      function onProgress() {
        loadedElement.style.width = (videoElement.buffered.length>=1 ? videoElement.buffered.end(videoElement.buffered.length - 1) / videoElement.duration * 100 : 0) + '%';
      }
      videoElement.addEventListener('canplay', function() {
        // Fix for webkit mobile browsers
        videoElement.muted = false;
        intVideoElement.playMedia = function() {
          play();
          window.addEventListener('keypress', keyboardControls);
          document.addEventListener('mozfullscreenchange', onFullscreenExit);
          document.addEventListener('webkitfullscreenchange', onFullscreenExit);
          document.addEventListener('fullscreenchange', onFullscreenExit);
        };
        intVideoElement.pauseMedia = function() {
          pause();
          window.removeEventListener('keypress', keyboardControls);
          document.removeEventListener('mozfullscreenchange', onFullscreenExit);
          document.removeEventListener('webkitfullscreenchange', onFullscreenExit);
          document.removeEventListener('fullscreenchange', onFullscreenExit);
        };
        durationElement.textContent = displayTime(videoElement.duration);
        currentTimeElement.textContent = displayTime(videoElement.currentTime);
        volumeLevelElement.style.width = videoElement.volume * 100 + '%';
        onProgress();
        videoElement.addEventListener('progress', onProgress);
        intVideoElement.dispatchEvent(canplay);
      });
      
      // Video ended
      videoElement.addEventListener('ended', function() {
        pause();
        intVideoElement.dispatchEvent(mediaEnded);
        this.currentTime = 0;
        // Leave fullscreen
        if(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement){
          fullscreenElement.classList.remove('full');
          document.exitFullscreen();
        }
      });

      touchHover(controlsElement);
      intVideoElement.addEventListener('mousemove', debounce(toggleControls, 20));
      var timer;

      function toggleControls() {
        controlsElement.classList.remove('hidden');
        if (timer) {
          window.clearTimeout(timer);
        }
        timer = window.setTimeout(function() {
          controlsElement.classList.add('hidden');
        }, 2000);
      }
      // expose controls
      this.controlsElement = controlsElement;
}
var extVideo = function(media){
  // iframe configuration
      var intVideoElement = this.element = document.createElement('iframe'),
        player = this,
        options = media.options;
      intVideoElement.id = media.provider + media.id;
      intVideoElement.provider = media.provider;
      intVideoElement.className = "ext-video";
      intVideoElement.setAttribute('frameborder', 0);
      intVideoElement.setAttribute('webkitallowfullscreen', '');
      intVideoElement.setAttribute('allowfullscreen', '');
      switch (media.provider) {
        case 'youtube':
          intVideoElement.setAttribute('src', 'https://youtube.com/embed/' + media.id + '?enablejsapi=' + (options.api || '1') + '&playerapiid=' + intVideoElement.id + '&rel=' + (options.rel || '0') + '&showinfo=' + (options.showinfo || '0') + '&color=' + (options.color || 'white') + '&iv_load_policy=' + (options.ivLoadPolicy || '3') + '&disablekb=' + (options.disablekb || '1') + '&cc_load_policy=' + (options.ccLoadPolicy || '0'));
          intVideoElement.addEventListener('load', function(e) {
            player.post('listening');
          });
          intVideoElement.addEventListener('ready', function(e) {
            player.post('command', 'setPlaybackQuality', ['highres']);
          });
          break;
        case 'vimeo':
          intVideoElement.setAttribute('src', 'https://player.vimeo.com/video/' + media.id + '?api=' + (options.api || '1') + '&player_id=' + intVideoElement.id + '&title=' + (options.title || '0') + '&portrait=' + (options.portrait || '0') + '&color=' + (options.color || 'f0f0f0') + '&byline=' + (options.byline || '0') + '&badge=' + (options.badge || '0'));
          intVideoElement.addEventListener('ready', function(e) {
            player.post('addEventListener', 'play');
            player.post('addEventListener', 'pause');
            player.post('addEventListener', 'finish');
          });
          break;
      }

      function keyboardControls(event) {
        event.stopImmediatePropagation();
        switch (event.key) {
          case " ":
            switch (intVideoElement.state) {
              case 1:
                player.post('pause');
                break;
              case 2:
              case 0:
                player.post('play');
                break;
            }
            event.preventDefault();
            break;
          case "Escape":
            intVideoElement.pauseMedia();
            intVideoElement.dispatchEvent(mediaPaused);
            break;
        }
      }
      // Create external API
      intVideoElement.playMedia = function() {
        player.post('play');
        window.addEventListener('keypress', keyboardControls);
      };
      intVideoElement.pauseMedia = function() {
        player.post('pause');
        window.removeEventListener('keypress', keyboardControls);
      };
      var playerOrigin = {
        "vimeo": "*",
        "youtube": "*"
      },
      statesLib = {
        "vimeo": ['finish', 'play', 'pause', 'ready'],
        "youtube": [0, 1, 2, 'onReady']
      } // 0 stopped || finish, 1 playing, 2 paused, 3 ready
      
      window.addEventListener('message', onMessageReceived, false);
    
      function onMessageReceived(event) {
        if (!(/^https?:\/\/(www\.)?(youtube|player\.vimeo)\.com.*/).test(event.origin)) {
          return false;
        }
        var data = JSON.parse(event.data),
          recipient = document.getElementById(data.id || data.player_id),
          origin = recipient.provider,
          states = statesLib[origin];
        if (playerOrigin[origin] === "*") playerOrigin[origin] = event.origin;
        if (data.event == states[3]) { // Player ready
          recipient.dispatchEvent(mediaReady);
          return true;
        }
        var state;
        switch (origin) {
          case 'vimeo':
            state = data.event;
            break;
          case 'youtube':
            state = (data.info) ? data.info.playerState : false;
            break;
        }
        if (recipient.state == state) return false;
        switch (state) {
          case states[0]:
            // Ended
            recipient.state = 0;
            recipient.dispatchEvent(mediaEnded);
            break;
          case states[1]:
            // Played
            recipient.state = 1;
            break;
          case states[2]:
            // Paused
            recipient.state = 2;
            break;
        }
      }
      function post(first, second, third) {
        var data = {},
          origin = this.element.provider;
        // Usual functions
        switch (first) {
          case 'play':
            switch (origin) {
              case 'youtube':
                first = 'command',
                  second = 'playVideo';
                break;
            }
            break;
          case 'pause':
            switch (origin) {
              case 'youtube':
                first = 'command',
                  second = 'pauseVideo';
                break;
            }
            break;
        }
        // API translator
        switch (origin) {
          case 'youtube':
            data.event = first;
            if (this.element.id) {
              data.id = this.element.id;
            }
            if (second) {
              data.func = second;
              if (third) {
                data.args = third;
              }
            }
            break;
          case 'vimeo':
            data.method = first;
            if (second) {
              data.value = second;
            }
            break;
        }
        var message = JSON.stringify(data);
        this.element.contentWindow.postMessage(message, playerOrigin[origin]);
      }
}