~(function(){
	var player = {},
		playList = [{//{{{
			title:'不再联系 - 程响',
			lrc:'./lrc/buzailianxi.lrc',
			src:'./mp3/buzailianxi'
		}, {
			title:'不再联系 - Alex',
			lrc:'./lrc/buzailianxi.lrc',
			src:'./mp3/buzailianxi2'
		}, {
			title:'从开始到现在 - 张信哲',
			lrc:'./lrc/congkaishidaoxianzai.lrc',
			src:'./mp3/congkaishidaoxianzai'
		}, {
			title:'只对你有感觉 - 飞轮海&Hebe',
			lrc:'./lrc/congkaishidaoxianzai.lrc',
			src:'./mp3/zhiduiniyouganjue'
		}, {
			title:'我知道你都知道 - 薛之谦',
			lrc:'./lrc/wozhidaonidouzhidao.lrc',
			src:'./mp3/wozhidaonidouzhidao'
		}];//}}}
	player.playList = playList;

	var instance = document.getElementById('player'),//html5 audio 的play,pause 等方法只能用原生的doc.getElementById获取的对象才能控制
		$instance = $(instance),
		$container  = $('#playMain'),
		$togglePlay = $('.icoplay'), 
		$progress = $("#progress"),
		$muteBtn = $('#mute'),
		$lrc = $('#lrcContent'),
		$mlist = $('#musicList'),
		$lists = $('#lists'),
		$loading = $('#loading'),
		$next = $('.iconext'),
		$volContainer = $('#vol'),
		$volCtrl = $('#volCtrl'),
		$volProgress = $('#volProgress'),
		$progressContent = $('#progressContent'),
		$repeatBtn = $('#repeatBtn'),
		$resetListBtn = $('#resetListBtn'),
		curIndex = 0,
		curVolume = 0.5,
		totalTime = 0,
		$timeDisplay = $('#timer'),
		origTop = 111,
		intervalTimer = null,
		suffix = $.browser.mozilla ? '.ogg' : '.mp3',
		tmpl = window.template,
		lrcData,
		showLrc,
		stepHeight = 18,
		lrcSetp = 0,
		repeatType = 'loop',
		repeatItems = ['loop','random','single'];
		repeatIterator = new Fayhot.Iterator(repeatItems);

	var clickPlay = function(e){
		var index = e.currentTarget.getAttribute('data-index');
		curIndex = index;
		play(index);
	};

	var clickNext = function(e){
		play(getNext());
	};

	var clickMute = function(e){
		setVolume(0);
	};

	var setLrc = function(lrc){
		lrc = lrcData = parseLrc(lrc);
		var words = lrc.words, times = lrc.times, data = lrc.data;
		var len = times.length,i = 0,str='',top = origTop;
		for(;i<len;i++){
			var t = times[i],w = words[t];
            str += '<p data-lrctime="'+t+'" data-lrctop="'+top+'">'+w+'</p>';
			top-=stepHeight;
		}
		data = [data.ti,data.ar,data.al].filter(function(a){return a!==''});
		lrcSetp = 0;
		$lrc.html(str).stop().animate({marginTop:origTop},1400).children().eq(0).addClass('cur');;
	};

	var parseLrc = function(lrc) { //解析lrc
	//{{{
		var arr = lrc.split(/[\r\n]/), 
		  len = arr.length, 
		  words = {}, 
		  times = [], i = 0;
		var musicData = {ti:'',ar:'',al:''};
		for (; i < len;) {
			var temp,doit = true,
			    str = decodeURIComponent(arr[i]), 
                word = str.replace(/\[\d*:\d*((\.|\:)\d*)*\]/g, '');
			
            'ti ar al'.replace(/\S+/g,function(a){
				if(doit && musicData[a]===''){
					temp = str.match(new RegExp('\\['+a+'\\:(.*?)\\]'));
					if(temp && temp[1]){
						doit = false;
						musicData[a] = temp[1]; 
					}
				}
			});
			
			if(word.length===0){
				word = "…… ……";
			}
			str.replace(/\[(\d*):(\d*)([\.|\:]\d*)*\]/g, function() {
				var min = arguments[1] | 0, 
					sec = arguments[2] | 0, 
					time = min * 60 + sec,
					p = times.push(time * 1e3);
				words[times[--p]] = word.trim();
			});
			i++;
		}
		times.sort(function(a, b) {
			return a - b;
		});
		return {
			words: words,
			times: times,
			data:musicData
		};//}}}
	};

	var timeFormat = function(time){
        var min = '00'+(time/60 |0),sec = time%60;
        sec = '00'+ (sec|0);
        return [min.substr(-2),sec.substr(-2)].join(':');
	};

    var loadLrc = function(url){ //加载歌词
		$.get(url, function(lrc){
			localStorage[url] = lrc;
			setLrc(lrc);
		});
	}
	
	player.init = function(){//默认播放第一首//{{{
		var html = tmpl.compile('tmpl_playlist',this.playList);
		$mlist.html(html).find('li:eq(0)').addClass('cur');
		$loading.fadeOut(400,function(){
			$container.fadeIn();
		});

		$mlist.find('li').on('click',clickPlay);
		$next.on('click',clickNext);
		$volContainer.slider({
            max: 1, 
			min: 0,
		   	step: 0.01,
            slide: function(event, ui) {
                setVolume(ui.value);
            },
            stop: function(event, ui) {
                if(ui.value===0){
                    $muteBtn.removeClass('icovol').addClass('iconmute');
                }else{
                    $muteBtn.removeClass('iconmute').addClass('icovol');
                }
            }
        });

		$progressContent.slider({//{{{
            step:0.1,
            slide: function(event, ui) {
                setProgress(instance.duration * ui.value / 100);
            },
            stop: function(event, ui) {
                instance.currentTime = instance.duration * ui.value / 100;
            }
        });//}}}

		$repeatBtn.on('click',function(){
			var rtype;
			repeatIterator.hasNext() ? (rtype = repeatItems[repeatIterator.next()]) : (repeatIterator.reset(),rtype = repeatItems[repeatIterator.current()]);
			$repeatBtn.removeClass(repeatType).addClass(rtype);
			repeatType = rtype;
		});

		$resetListBtn.on('click', function(){
			if($lists.hasClass('icomusic')){
				$lists.removeClass('icomusic').addClass('icolist');
				$lists.animate({marginLeft:-290});
				showLrc = true;
			}else{
				$lists.removeClass('icolist').addClass('icomusic');
				showLrc = false;
				$lists.animate({marginLeft:0});
			}
		});
        
		$muteBtn.toggle(
			function(){
				$muteBtn.removeClass('icovol').addClass('iconmute');
				setVolume(0);
			},function(){
				$muteBtn.removeClass('iconmute').addClass('icovol');
				setVolume(1);
			}
		);
		$togglePlay.toggle(
			function(){
				$togglePlay.addClass('icopause');
				player.pause();
			},function(){
				$togglePlay.removeClass('icopause');
				player.play();
			}
		);
		play(curIndex);
		setProgress(0);
	};//}}}

	player.play = function(){
		intervalTimer || (intervalTimer = setInterval(progressing,300));
		instance.play();
	};

	player.pause = function(){
		intervalTimer && (clearInterval(intervalTimer), intervalTimer = null);
		instance.pause();
	};

	player.getCurrentTime = function(){
		return instance.currentTime;
	};

	player.getTotalTime = function(){
		return instance.duration;
	};

	player.load = function(source){
		source = source || playList[0];
		instance.src = source.src + suffix;
		_bindEvent(instance);
	};

	var setProgress = function(time){
		var ratio = parseInt(time * 100 / totalTime);
		$progress.css({width:ratio});
        $timeDisplay.html(timeFormat(time)+'/'+timeFormat(player.getTotalTime()));
	};

	var setVolume = function(ratio){
		instance.volume = ratio;
        $volProgress.css('width', ratio * 100 + '%');
        $volCtrl.css('left', ratio * 100 + '%');
	};

	var progressing = function(){
        var words = lrcData.words, 
		  times = lrcData.times,
		  len = times.length, i = lrcSetp,
          curTime = instance.currentTime*1e3|0;
        for(;i<len;i++){
            var t = times[i]; 
            if (curTime > t && curTime < times[i + 1]) {
                lrcSetp = i;
				var $cur = $lrc.find('[data-lrctime="'+t+'"]');
                var top = $cur.attr('data-lrctop');
				document.title = $cur.html();
				if(showLrc){
					$lrc.stop().animate({marginTop:top}).find('p.cur').removeClass('cur');
				}else{
					$lrc.css({marginTop:top}).find('p.cur').removeClass('cur');
				}
				$cur.addClass('cur');
                break;
            }
        }
		setProgress(player.getCurrentTime());
	};

	var play = function(i){ //播放
		var source = player.playList[i];
		player.load(source);
		
		if(localStorage[source.lrc] && localStorage[source.lrc]!==''){
			setLrc(localStorage[source.lrc]);
		} else{
			loadLrc(source.lrc);
		}
		$('#musicList li.cur').removeClass('cur'), $('#musicList > li').eq(i).addClass('cur');
		totalTime = player.getTotalTime();
		player.play();
	}

    var ended = function(){
		play(getNext());
    }

	var getNext = function(){ //获取下一首歌曲索引//{{{
		curIndex = curIndex || 0;
		switch (repeatType) {
			case 'single':
				break;
			case 'loop':
				++curIndex >= playList.length && (curIndex = 0);
				break;
			case 'random':
				curIndex = Math.random() * (playList.length - 1) | 0;
				break;
			default:
				curIndex = 0;
		}
		return curIndex; 
	}//}}}

	var _bindEvent = function(instance){ //绑定audio对象事件//{{{
		$instance.unbind('canplay');
		$instance.bind('canplay',function(){
            totalTime = this.duration;
        }).bind('ended', ended);
	}//}}}
	player.init();
})();
