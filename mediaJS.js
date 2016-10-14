/* global debounce,
* touchHover
*/

/*
* @class mediaJS
*
* @description
* 
* Creates a media element
*
* @property {Object} element - the mediaJS DOM element
* @property {number} element.state - 0 stopped || finish, 1 playing, 2 paused, 3 ready
* @property {boolean} element.iFrame - true if the media require an iframe, false otherwise
* @property {function} element.play - play media
* @property {function} element.pause - pause media
* @property {function} element.ready - dispatch ready event on element
* @property {function} element.ended - dispatch ended event on element
*
* @param {string|string[]|Object|Object[]} configuration - a media URL, an Array of these, a configurationObject or an Array of those
*
* @param {string|string[]|Object|Object[]} configuration.uri - a media URL, an external video id, a videoSourceObject or an Array of those
* @param {string} [configuration.provider] - the media provider from : ('vimeo'|'youtube'|'video'|'picture')
* @param {string} [configuration.name] - a media's name to be displayed
* @param {Object} [configuration.options] - an Object containing options relative to the media's provider
*
* @param {Object[]|string[]} configuration.uri.tracks - an Array of tracks string src or trackObject 
* @param {string} [configuration.uri.name] - a source's name displayed in the player
*
* video
* @param {string} configuration.uri.tracks.src - the URI of the track
* @param {string} [configuration.uri.tracks.type='video/mp4'] - the mime type of the track
*
* @param {boolean} [configuration.options.muted=false]
* @param {string} [configuration.options.preload='auto'] - ('none'|'metadata'|'auto')
* @param {string} [configuration.options.poster] - URI to poster
* @param {number} [configuration.options.default=0] - index of default source in configurationObject.uri
* @param {boolean} [configuration.options.time=true] - Show current time and duration
*
* youtube
* @param {number} [configuration.options.api=1] - enable API
* @param {number} [configuration.options.rel=0]
* @param {number} [configuration.options.showinfo=0]
* @param {string} [configuration.options.color='white'] - Color of the player, red or white
* @param {number} [configuration.options.ivLoadPolicy=3]
* @param {number} [configuration.options.disablekb=1] - Disable keyboard's controls, 
* @param {number} [configuration.options.ccLoadPolicy=0]
*
* vimeo
* @param {number} [configuration.options.api=1] - enable API
* @param {number} [configuration.options.title=0] - Show video title in iframe
* @param {number} [configuration.options.portrait=0] - Show author's picture
* @param {string} [configuration.options.color='f0f0f0'] - Color of player's controls
* @param {number} [configuration.options.byline=0] - Show user byline with video's title
* @param {number} [configuration.options.badge=0] - Show author's badge
*
*/
var mediaJS = function(configuration) {
  var media = this,
    uri,
    provider,
  
  // init Events
    mediaReady = document.createEvent('Event'),
    mediaEnded = document.createEvent('Event'),
    mediaPaused = document.createEvent('Event');
  mediaReady.initEvent('ready', true, true),
    mediaEnded.initEvent('ended', true, true),
    mediaPaused.initEvent('paused', true, true);
  
  /*
  * @description
  * get Provider String from URL
  *
  * @param {string} uri - a media URL
  * @return {string} provider - the media provider from : ('vimeo'|'youtube'|'video'|'picture') or false
  */
  function getProvider(uri){
    if(uri.constructor === Array) return 'video';
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
  
  /*
  * @description
  *
  * create a gallery which will behave like a media content
  *
  * @param {string[]} slidesUri - an Array of uri or configurationObjects
  */
  function createGallery(slidesUri){
    var galleryElement = media.element = document.createElement('div');
    var controls = document.createElement('div'),
      next = document.createElement('div'),
      previous = document.createElement('div');
    var slides = [];
    galleryElement.className = 'gallery media-js';
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
    for (var i = 0; i < slidesUri.length; i++) {
      var slideUri = slidesUri[i],
        slideElement = slides[i] = document.createElement('div');
      slideElement.className = i + ' slide';
      slideElement.loadEventType = 'load';
      var slideMedia = new mediaJS(slideUri);
      slideElement.media = slideMedia.element;
      slideElement.appendChild(slideMedia.element);
      switch (getProvider(slideUri)) {
        case "vimeo":
        case "youtube":
          break;
        case "video":
          break;
        case "picture":
          slideElement.addEventListener('click', nextSlide);
      }
      // block slideMedia's event propagation
      if(slideMedia.element) slideMedia.element.addEventListener('ended', function(event){
        event.stopPropagation();
      });
      slideElement.preload.addEventListener('ready', function(event) {
        if(slides.indexOf(this) != 0) event.stopPropagation();
        this.loaded = true;
      }.bind(slideElement));
      // add name
      if (slideUri.name) {
        name.textContent = slideUri.name;
        slideElement.nameElement = name.cloneNode(true);
        slideElement.appendChild(slideElement.nameElement);
      }
      galleryElement.appendChild(slideElement);
    }
    
    // First slide is selected
    slides[0].classList.add('selected');
    var selectedSlideIndex = 0;
    
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
        case "Enter":
          toggleMedia();
          break;
        case "ArrowUp":
        case "ArrowRight":
          nextSlide();
          break;
        case "ArrowDown":
        case "ArrowLeft":
          previousSlide();
          break;
        case "Escape":
          galleryElement.pause();
          break;
      }
    }
    
    // toggle slideMedia state
    function toggleMedia(){
      var slideMedia = slides[selectedSlideIndex].media;
      switch (slideMedia.state) {
        case 1:
          slideMedia.pause();
          break;
        case 2:
        case 0:
          slideMedia.play();
          break;
      }
    }
    
    // unload (and select if event) loading slide
    function loadedSlide(event) {
      if (event) selectSlide(loading);
      slides[loading].media.removeEventListener('ready', loadedSlide);
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
        slides[loading].media.addEventListener('ready', loadedSlide);
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
      slides[selectedSlideIndex].media.pause();
      slides[index].classList.add('selected');
      selectedSlideIndex = index;
      toggleControls();
    }
    next.addEventListener('click', nextSlide);
    previous.addEventListener('click', previousSlide);
    touchHover(controls);
    galleryElement.addEventListener('mousemove', debounce(toggleControls, 20));
    galleryElement.play = function() {
      window.addEventListener('keypress', keyboardControls);
    };
    galleryElement.pause = function() {
      window.removeEventListener('keypress', keyboardControls);
      galleryElement.dispatchEvent(mediaPaused);
      slides[selectedSlideIndex].media.pause();
    };
  }
  
  /*
  * @description
  *
  * create a mediaJS external video from a youtube or vimeo provider
  *
  */
  function createExtVideo(){
    // iframe configuration
    var extVideoElement = media.element = document.createElement('iframe'),
      options = configuration.options,
      videoId,
      playerId;
    extVideoElement.provider = provider;
    extVideoElement.className = "media-js";
    extVideoElement.setAttribute('frameborder', 0);
    extVideoElement.setAttribute('webkitallowfullscreen', '');
    extVideoElement.setAttribute('allowfullscreen', '');
    if(uri.indexOf('/') < 0){
      // uri is a videoID
      videoId = uri;
      switch (provider) {
        case 'youtube':
          uri = 'https://youtube.com/embed/' + videoId + '?enablejsapi=' + (options.api || '1') + '&rel=' + (options.rel || '0') + '&showinfo=' + (options.showinfo || '0') + '&color=' + (options.color || 'white') + '&iv_load_policy=' + (options.ivLoadPolicy || '3') + '&disablekb=' + (options.disablekb || '1') + '&cc_load_policy=' + (options.ccLoadPolicy || '0');
          break;
        case 'vimeo':
          uri = 'https://player.vimeo.com/video/' + videoId + '?api=' + (options.api || '1') + '&title=' + (options.title || '0') + '&portrait=' + (options.portrait || '0') + '&color=' + (options.color || 'f0f0f0') + '&byline=' + (options.byline || '0') + '&badge=' + (options.badge || '0');
          break;
      }
    }else{
      // retrieve videoId from URI
      videoId = uri.split('?')[0].split('/').pop();
    }
    extVideoElement.id = provider + videoId;
    // Configure playerId to communicate with the provider, listen for events
    switch (provider) {
      case 'youtube':
        playerId = '&playerapiid=' + extVideoElement.id;
        extVideoElement.addEventListener('load', function(e) {
          media.post('listening');
        });
        extVideoElement.addEventListener('ready', function(e) {
          media.post('command', 'setPlaybackQuality', ['highres']);
        });
        break;
      case 'vimeo':
        playerId = '&player_id=' + extVideoElement.id;
        extVideoElement.addEventListener('ready', function(e) {
          media.post('addEventListener', 'play');
          media.post('addEventListener', 'pause');
          media.post('addEventListener', 'finish');
        });
        break;
    }
    extVideoElement.setAttribute('src', uri.split('?').splice(1,0,playerId).join());
  
    function keyboardControls(event) {
      event.stopImmediatePropagation();
      switch (event.key) {
        case " ":
          switch (extVideoElement.state) {
            case 1:
              media.post('pause');
              break;
            case 2:
            case 0:
              media.post('play');
              break;
          }
          event.preventDefault();
          break;
        case "Escape":
          extVideoElement.pause();
          extVideoElement.dispatchEvent(mediaPaused);
          break;
      }
    }
    // Create external API
    extVideoElement.play = function() {
      media.post('play');
      window.addEventListener('keypress', keyboardControls);
    };
    extVideoElement.pause = function() {
      media.post('pause');
      window.removeEventListener('keypress', keyboardControls);
    };
    media.post = function (first, second, third) {
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
      media.element.contentWindow.postMessage(message, mediaJS.playerOrigin[origin]);
    };
  }
  
  /*
  * @description
  *
  * create a mediaJS video from a video URI or multiples URI in configuration.uri
  * @property {Object} controlsElement - DOM element containing player's controls
  * @property {string} played - percentage of played video (used for analytics)
  *
  */
  function createVideo(){
    var div = document.createElement('div'),
      videoWrapper = media.element = div.cloneNode(),
      
      options = configuration.options || {},
  
      // Video VideoElement
      videoElement = media.videoElement = document.createElement('video');
    videoElement.setAttribute('webkitallowfullscreen', '');
    videoElement.setAttribute('allowfullscreen', '');
    videoElement.setAttribute('muted', options.muted || false);
    videoElement.setAttribute('preload', options.preload || 'auto');
    if(options.poster) videoElement.setAttribute('poster', options.poster);
    videoWrapper.className = "video media-js";
    
    // Sources
    // configure sources Array in case of lazy uri typing
    var sources = (uri.constructor === Array) ? (uri[0].tracks) ? uri : [{tracks:uri}] : [{tracks:[uri]}],
    sourceElement = document.createElement('source'),
    loaderTimeOutID;
    
    function changeSource(sourceIndex){
      var source = sources[sourceIndex || options.default || 0],
        track,
        currentTime = videoElement.currentTime;
      if(!videoElement.paused) play();
      window.clearTimeout(loaderTimeOutID);
      // wipe previous
      videoElement.innerHTML = '';
      for (var i = source.tracks.length - 1; i >= 0; i--) {
        track = source.tracks[i];
        sourceElement.setAttribute('type', track.type || 'video/mp4');
        sourceElement.setAttribute('src', track.src || track);
        videoElement.appendChild(sourceElement.cloneNode());
      }
      videoElement.load();
      videoElement.currentTime = currentTime;
      loader();
      var previouslySelectedList = qualitySelectorElement.getElementsByClassName('selected');
      for( i = 0; i<previouslySelectedList.length; i++) previouslySelectedList[i].classList.remove('selected');
      source.element.classList.add('selected');
    }
    videoWrapper.appendChild(videoElement);
    
    // Controls
    var controlsElement = div.cloneNode(),
      controlsLeftElement = div.cloneNode();
    controlsElement.classList.add('controls');
    controlsLeftElement.classList.add('controls-left');
    videoWrapper.appendChild(controlsElement);
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
      videoWrapper.classList.add('grabbing');
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
      videoWrapper.classList.remove('grabbing');
      play();
    }
    progressBarElement.addEventListener('mousedown', onSeek);
    progressBarElement.addEventListener('click', seeking);
  
    // Played
    function onTimeUpdate() {
      playedElement.style.width = media.played = (videoElement.currentTime / videoElement.duration) * 100 + '%';
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
      videoWrapper.classList.add('grabbing');
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
      videoWrapper.classList.remove('grabbing');
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
    // create only if multiple sources
    if(sources.length > 1){
      var qualitySelectorElement = div.cloneNode(),
      qualitiesElement = div.cloneNode();
      qualitySelectorElement.classList.add('quality-selector');
      qualitiesElement.className = 'qualities';
      qualitySelectorElement.appendChild(qualitiesElement);
      controlsElement.appendChild(qualitySelectorElement);
      for(var i = 0; i < sources.length; i++){
        // We have to use a wrapper to create a fresh qualityElement each time
        (function(sourceIndex){
          var qualityElement = div.cloneNode();
          qualityElement.classList.add('quality');
          // reference of element to select it on sourceChange
          qualityElement.textContent = sources[sourceIndex].name || 'video '+i+1;
          configuration.sources[sourceIndex].element = qualityElement;
          qualityElement.addEventListener('click', function(){
            if(!this.classList.contains('selected')){
              changeSource(sourceIndex);
              videoElement.addEventListener(function(){
                play();
                videoElement.removeEventListener('changeSource');
              },'changeSource');
            }
          });
          qualitiesElement.appendChild(qualityElement);
        }(i));
      }
    }
    
    // Fullscreen
    var fullscreenElement = div.cloneNode();
    fullscreenElement.classList.add('fullscreen');
    controlsElement.appendChild(fullscreenElement);
  
    var requestFullscreen = function() {
      if (document.documentElement.requestFullscreen) {
        return function(videoWrapper) {
          videoWrapper.requestFullscreen();
        };
      }
      else if (document.documentElement.msRequestFullscreen) {
        return function(videoWrapper) {
          videoWrapper.msRequestFullscreen();
        };
      }
      else if (document.documentElement.mozRequestFullScreen) {
        return function(videoWrapper) {
          videoWrapper.mozRequestFullScreen();
        };
      }
      else if (document.documentElement.webkitRequestFullscreen) {
        return function(videoWrapper) {
          videoWrapper.webkitRequestFullscreen(videoWrapper.ALLOW_KEYBOARD_INPUT);
        };
      }
    }();
    document.exitFullscreen = function() {
      return (document.exitFullscreen || document.msExitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen);
    }();
  
    function onFullscreen() {
      if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        fullscreenElement.classList.add('full');
        requestFullscreen(videoWrapper);
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
          videoWrapper.pause();
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
  
    // Simple loading interface attaching a value ]0,1] as 1 is canplaythrought and 0 is havenothing and triggering a 'loading' event on the videoWrapper
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
          videoWrapper.loaded = (progress) ? (progress * (1 + (progress - previousProgress) / time) / videoElement.duration) : 0;
          videoWrapper.dispatchEvent(intVideoLoading);
          previousProgress = progress || previousProgress;
          fourCount = 0;
          break;
        case 4:
          // in case there is 3 consecutive readyState 4 or loaded near the end
          if (videoWrapper.loaded > 0.9 || fourCount >= 2) {
            videoWrapper.loaded = 1;
            videoElement.dispatchEvent(mediaReady);
            return;
          }
          else fourCount += 1;
      }
      loaderTimeOutID = window.setTimeout(loader, time);
    }
    
    // start loading except if specicified
    if(!configuration.noload) changeSource();
    // expose two methods to control the loading
    videoWrapper.loadMedia = changeSource;
    videoWrapper.stopMedia = function(){
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
      videoWrapper.play = function() {
        play();
        window.addEventListener('keypress', keyboardControls);
        document.addEventListener('mozfullscreenchange', onFullscreenExit);
        document.addEventListener('webkitfullscreenchange', onFullscreenExit);
        document.addEventListener('fullscreenchange', onFullscreenExit);
      };
      videoWrapper.pause = function() {
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
      videoWrapper.dispatchEvent(canplay);
    });
    
    // Video ended
    videoElement.addEventListener('ended', function() {
      pause();
      videoWrapper.dispatchEvent(mediaEnded);
      this.currentTime = 0;
      // Leave fullscreen
      if(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement){
        fullscreenElement.classList.remove('full');
        document.exitFullscreen();
      }
    });
  
    touchHover(controlsElement);
    videoWrapper.addEventListener('mousemove', debounce(toggleControls, 20));
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
    media.controlsElement = controlsElement;
  }
  
  /*
  * @description
  *
  * create a mediaJS picture from uri
  *
  */
  function createPicture(){
    var pictureElement = media.element = document.createElement('div');
    pictureElement.className = 'picture media-js';
    var preload = new Image();
    preload.src = uri;
    preload.addEventListener('load',function(){
      pictureElement.dispatchEvent(mediaReady);
      pictureElement.state = 3;
    }); 
    pictureElement.style['background-image'] = "url('" + uri + "')";
    // expose dummies
    pictureElement.play = function(){ return true};
    pictureElement.pause = function(){ return true};
  }
  
  // catch gallery
  if(configuration.constructor === Array){
    createGallery(configuration);
  }
  else{
    // get URI
    if(typeof configuration === "string") uri = configuration;
    else if(configuration.uri) uri = configuration.uri;
    // invalid URI Abort mission
    else return false; 
    
    // get provider
    provider = configuration.provider || getProvider(uri);
    
    // create media
    switch (provider) {
      case 'vimeo':
      case 'youtube':
        createExtVideo();
        break;
      case 'video':
        createVideo();
        break;
      case 'picture':
        createPicture();
        break;
    }
    media.ready = function(){
      media.element.dispatchEvent(mediaReady);
    };
    media.ended = function(){
      media.element.dispatchEvent(mediaEnded);
    };
  }
};

mediaJS.playerOrigin = {
  "vimeo": "*",
  "youtube": "*"
};
/*
* @description
*
* catch iframe's messages from mediaJS elements
*
* @param {Object} event - the message event
*/
function onMessageReceived(event) {
  var statesLib = {
    "vimeo": ['finish', 'play', 'pause', 'ready'],
    "youtube": [0, 1, 2, 'onReady']
  }; // 0 stopped || finish, 1 playing, 2 paused, 3 ready

  if (!(/^https?:\/\/(www\.)?(youtube|player\.vimeo)\.com.*/).test(event.origin)) {
    return false;
  }
  var data = JSON.parse(event.data),
    recipient = document.getElementById(data.id || data.player_id),
    origin = recipient.provider,
    states = statesLib[origin];
  // This message isn't for us
  if(!recipient.classList.contains('media-js')) return false; 
  if (mediaJS.playerOrigin[origin] === "*") mediaJS.playerOrigin[origin] = event.origin;
  if (data.event == states[3]) { // Player ready
    recipient.ready();
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
      recipient.ended();
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
window.addEventListener('message', onMessageReceived, false);