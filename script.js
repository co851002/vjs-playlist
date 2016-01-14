//videojs-playlists.js
function playList(options,arg){
  var player = this;
  player.pl = player.pl || {};
  var index = parseInt(options,10);

  player.pl._guessVideoType = function(video){
    var videoTypes = {
      'webm' : 'video/webm',
      'mp4' : 'video/mp4',
      'ogv' : 'video/ogg'
    };
    var extension = video.split('.').pop();

    return videoTypes[extension] || '';
  };

  player.pl.init = function(videos, options) {
    options = options || {};
    player.pl.videos = [];
    player.pl.current = 0;
    player.on('ended', player.pl._videoEnd);

    if (options.getVideoSource) {
      player.pl.getVideoSource = options.getVideoSource;
    }

    player.pl._addVideos(videos);
  };

  player.pl._updatePoster = function(posterURL) {
    player.poster(posterURL);
    player.removeChild(player.posterImage);
    player.posterImage = player.addChild("posterImage");
  };

  player.pl._addVideos = function(videos){
    for (var i = 0, length = videos.length; i < length; i++){
      var aux = [];
      for (var j = 0, len = videos[i].src.length; j < len; j++){
        aux.push({
          type : player.pl._guessVideoType(videos[i].src[j]),
          src : videos[i].src[j]
        });
      }
      videos[i].src = aux;
      player.pl.videos.push(videos[i]);
    }
  };

  player.pl._nextPrev = function(func){
    var comparison, addendum;

    if (func === 'next'){
      comparison = player.pl.videos.length -1;
      addendum = 1;
    }
    else {
      comparison = 0;
      addendum = -1;
    }

    if (player.pl.current !== comparison){
      var newIndex = player.pl.current + addendum;
      player.pl._setVideo(newIndex);
      player.trigger(func, [player.pl.videos[newIndex]]);
    }
  };

  player.pl._setVideo = function(index){
    if (index < player.pl.videos.length){
      player.pl.current = index;
      player.pl.currentVideo = player.pl.videos[index];

      if (!player.paused()){
        player.pl._resumeVideo();
      }

      if (player.pl.getVideoSource) {
        player.pl.getVideoSource(player.pl.videos[index], function(src, poster) {
          player.pl._setVideoSource(src, poster);
        });
      } else {
        player.pl._setVideoSource(player.pl.videos[index].src, player.pl.videos[index].poster);
      }
    }
  };

  player.pl._setVideoSource = function(src, poster) {
    player.src(src);
    player.pl._updatePoster(poster);
  };

  player.pl._resumeVideo = function(){
    player.one('loadstart',function(){
      player.play();
    });
  };

  player.pl._videoEnd = function(){
    if (player.pl.current === player.pl.videos.length -1){
      player.trigger('lastVideoEnded');
    }
    else {
      player.pl._resumeVideo();
      player.next();
    }
  };

  if (options instanceof Array){
    player.pl.init(options, arg);
    player.pl._setVideo(0);
    return player;
  }
  else if (index === index){ // NaN
    player.pl._setVideo(index);
    return player;
  }
  else if (typeof options === 'string' && typeof player.pl[options] !== 'undefined'){
    player.pl[options].apply(player);
    return player;
  }
}

videojs.Player.prototype.next = function(){
  this.pl._nextPrev('next');
  return this;
};
videojs.Player.prototype.prev = function(){
  this.pl._nextPrev('prev');
  return this;
};

videojs.plugin('playList', playList);


(function(){
  var videos = [
    {
      src : [
        'http://demos.vibrantmedia.com/demos/vibrantdemos/Testing/ChristoTest/vjsTest/video3.mp4'
      ],
      poster : 'https://placehold.it/200x150',
      title : 'The All New Honda Jazz'
    },
    {
      src : [
        'http://demos.vibrantmedia.com/demos/vibrantdemos/Testing/ChristoTest/vjsTest/video1.mp4'
      ],
      poster : 'https://placehold.it/200x150',
      title : 'Dhruv Bakers Chimmichurri Sauce'
    },
    {
      src : [
        'http://demos.vibrantmedia.com/demos/vibrantdemos/Testing/ChristoTest/vjsTest/video2.mp4'
      ],
      poster : 'https://placehold.it/200x150',
      title : 'Dhruvs Lamb with Pesto Hollandaise'
    },
    {
      src : [
        'http://demos.vibrantmedia.com/demos/vibrantdemos/Testing/ChristoTest/vjsTest/video3.mp4'
      ],
      poster : 'https://placehold.it/200x150',
      title : 'Placeholder Video'
    },
  ];


  var demoModule = {
    init : function(){
      this.els = {};
      this.cacheElements();
      this.initVideo();
      this.createListOfVideos();
      this.bindEvents();
      this.overwriteConsole();
    },
    overwriteConsole : function(){
      console._log = console.log;
      console.log = this.log;
    },
    log : function(string){
      demoModule.els.log.append('<p>' + string + '</p>');
      console._log(string);
    },
    cacheElements : function(){
      this.els.$playlist = $('div.playlist > ul');
      this.els.$next = $('#next');
      this.els.$prev = $('#prev');
      this.els.log = $('div.panels > pre');
    },
    initVideo : function(){
      this.player = videojs('video');
      this.player.playList(videos);
    },
    createListOfVideos : function(){
      var html = '';
      for (var i = 0, len = this.player.pl.videos.length; i < len; i++){
        html += '<li data-videoplaylist="'+ i +'">'+
                  '<span class="number">' + (i + 1) + '</span>'+
                  '<span class="poster"><img src="'+ videos[i].poster +'"></span>' +
                  '<span class="title">'+ videos[i].title +'</span>' +
                '</li>';
      }
      this.els.$playlist.empty().html(html);
      this.updateActiveVideo();
    },
    updateActiveVideo : function(){
      var activeIndex = this.player.pl.current;

      this.els.$playlist.find('li').removeClass('active');
      this.els.$playlist.find('li[data-videoplaylist="' + activeIndex +'"]').addClass('active');
    },
    bindEvents : function(){
      var self = this;
      this.els.$playlist.find('li').on('click', $.proxy(this.selectVideo,this));
      this.els.$next.on('click', $.proxy(this.nextOrPrev,this));
      this.els.$prev.on('click', $.proxy(this.nextOrPrev,this));
      this.player.on('next', function(e){
        console.log('Next video');
        self.updateActiveVideo.apply(self);
      });
      this.player.on('prev', function(e){
        console.log('Previous video');
        self.updateActiveVideo.apply(self);
      });
      this.player.on('lastVideoEnded', function(e){
        console.log('Last video has finished');
      });
    },
    nextOrPrev : function(e){
      var clicked = $(e.target);
      this.player[clicked.attr('id')]();
    },
    selectVideo : function(e){
      var clicked = e.target.nodeName === 'LI' ? $(e.target) : $(e.target).closest('li');

      if (!clicked.hasClass('active')){
        console.log('Selecting video');
        var videoIndex = clicked.data('videoplaylist');
        this.player.playList(videoIndex);
        this.updateActiveVideo();
      }
    }
  };

  demoModule.init();
})(jQuery);