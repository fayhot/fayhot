	var eventSpliter = /\s+/;
	var events = {
		//自定义事件//{{{
		_callbacks:null,
		on:function(events,callback,context){
			if(!callback && (typeof callback === 'function')){
			   	return this;
			}
			var event, list, exist,
				events = events.split(eventSpliter),
				callbacks = this._callbacks || (this._callbacks = {});

			while(event = events.shift()){
				exist = false;
				list = callbacks[event] || (callbacks[event] = []);
				for(var i = 0 , len = list.length ; i < len ; i ++){ //判断是否已经添加
					if(list[i].func === callback && list[i].context === context){
						exist = true;
						break;
					}
				}
				!exist && list.push({ func:callback, context:context });
			}
			return this;
		},
		off:function(events,callback,context){
			if(!(callbacks = this._callbacks)){
				return this;
			}
			if(!(events || callback || context)){
				this._callbacks = {};
				return this;
			}
			var callbacks, event, list,
				events = events ? events.split(eventSpliter) : Object.keys(callbacks);

			while(event = events.shift()){
				if(!callbacks[event] || !callback){
					delete callbacks[event];
					continue;
				}
				list = callbacks[event];
				for(var i = list.length - 1 ; i >= 0 ; i --){
					if(list[i].func === callback){
						if(context){
							if(list[i].context === context){
								list.splice(i,1);
							}
						}else{
							list.splice(i,1);
						}
					}
				}
			}
			return this;
		},
		trigger:function(events){
			if(!this._callbacks){
				return this;
			}
			var event,list,
				args = [],
				callbacks = this._callbacks,
				events = events.split(eventSpliter);

			//arguments 不是数组
			args = [].slice.call(arguments,1);

			while(event = events.shift()){
				(list = callbacks[event]) && (list = list.slice());
				if(!!list){
					for(var i = 0, len = list.length ; i < len ; i ++){//list[i]存在判断
						!!list[i] && list[i].func.apply(list[i].context || this, args);
					}
				}
			}
			return this;
		}//}}}
	};
