/**
 * 依赖列表:
 * 1.严重依赖jquery , jquery version >= 1.7,通过jquery处理dom选择、事件绑定、事件委托、浏览器兼容
 * 2.依赖于template.js模板引擎,模板引擎编译html字符串,并绑定变量和函数
 * 3.依赖于工具函数包tool.js,该js封装了常用的js工具函数
 */
~(function(win,undefined){
	var win = window;
	var $ = win.jQuery || null,
		doc   = win.document,
		head  = doc.getElementsByTagName("head")[0] || doc.getElementsByTagName("body")[0],
		input = doc.createElement("input"),
		encurl= win.encodeURI,
		enccpt= win.encodeURIComponent,
		agent = win.navigator.userAgent,
		tmpl = win.template,
		Fayhot = {};


    Fayhot.isReady = false;
	$(function(){
		Fayhot.isReady = true;
	});

	var _logReg = Fayhot.logReg || undefined;
	Fayhot.debug = true;

	Fayhot.log = function(){//默认浏览器支持console.log
		if(!Fayhot.debug){
			return;
		}
		!_logReg && (_logReg = Fayhot.logReg);
		var args = [],
			len = arguments.length;
		if(len < 1){
			return;
		}
		var logKey = arguments[len - 1];
		if(!_logReg || _logReg.test(logKey)){
			for(var i = 0 ; i < len ; i ++){
				args.push(arguments[i]);
			}
			console.log.apply(console,args); // 完全模拟 console.log
		}
	};

    /**
	 * 私有变量
	 */
	var helper = window.helper;

	/**
	 * 延迟执行初始化函数,直到DOM ready
	 */
	Fayhot.ready = function(init){
		$(init);
	};

	/**
	 * 默认配置
	 */
	var defaults = {
		//默认设置//{{{
		site:{
			remote:'http://service.mix.sina.com.cn/js/comment',
		},
		source:{
			css:'/css/comment/style.css',
			json:'/js/comment/json2.js',
			easyXDM:'/js/comment/easyXDM.js',
			jQuery:'/js/comment/jquery.min.js'
		},
		domain:'51fm.sinaapp.com.cn',
		baseUrl:'http://service.mix.sina.com.cn',
		proxy:true//}}}
	}, config = $.extend({},defaults,win.FayhotConfig||{});

	/**
	 * 获取ajax请求代理的实例
	 * 实例为 $.ajax 的封装,或者easyXDM的xmlhttp实现
	 */
	var getProxyInstance = function(crossDomain){
		//获取代理实例 easyXDM or jQuery.ajax//{{{
		var proxy = null;
		if(!!crossDomain){
			return {//easyXDM
			}
		}else{
			return {//jquery
				request:function(config,succfn,failfn){
					var url = config.url,
						method = config.type,
						data = helper.buildQuery(config.data || {});
					$.ajax({
						url:url,
						type:method,
						data:data,
						success:function(response){
							try{
								(response.data && typeof response.data != 'object') && (response.data = helper.jsonDecode(response.data));
								request.vresponse(succfn,failfn)(response.data);
							}catch(e){ 
								helper.log(e); 
							}
						}
					});
				}
			}
		}//}}}
	};

	var proxy = getProxyInstance(false);

	/**
	 * 异步加载资源文件
	 */
	var load = {
		//js 异步加载资源文件//{{{
		styleSheet:function(href,callback){
			var link  = doc.createElement("link");
				link.type = "text/css",
				link.rel  = "stylesheet",
				link.href = href;
			head.appendChild(link);
			callback instanceof Function ? callback() : ""; 
		},

		style:function(cssText,callback){
			var style = doc.createElement("style"),
				cssText = cssText.replace(/\}/g, "}\n");
				style.type = "text/css";
			style.styleSheet ? 
			style.styleSheet.cssText = cssText : 
			style.appendChild(doc.createTextNode(cssText));
			head.appendChild(style);
			callback instanceof Function ? callback() : ""; 
		},

		script:function(scripts,callback,async){//todo : 添加回调模型,重用异步加载js的代码,现在还是在if else下都写了
			var scripts = scripts;
			(typeof scripts !== 'object') && (scripts = [scripts]);
			if(async === true){
				var s = new Array() , loaded = 0;
				for(var i = 0, len = scripts.length ; i < len ; i ++){
					s[i] = document.createElement("script");
					s[i].setAttribute("type","text/javascript");
					s[i].onload = s[i].onreadystatechange = function() { 
						if(!win.ActiveXObject || this.readyState == "loaded" || this.readyState == "complete") {
						   loaded++;
						   this.onload = this.onreadystatechange = null; 
						   loaded == len && (typeof callback == "function") && callback();
						}
					};
					s[i].setAttribute("src",scripts[i]);
					head.appendChild(s[i]);
				}
			}else{
				var s = new Array(), last = scripts.length - 1, queueLoad = function(i) {
					s[i] = doc.createElement("script");
					s[i].setAttribute("type","text/javascript");
					s[i].onload = s[i].onreadystatechange = function() {
					   if(!win.ActiveXObject || this.readyState == "loaded" || this.readyState == "complete") {
						   this.onload = this.onreadystatechange = null; 
						   i == last ? (typeof callback == 'function' && callback()) : queueLoad(i + 1);
					   }
					}
					s[i].setAttribute("src",scripts[i]);
					head.appendChild(s[i]);
				};
				queueLoad(0);
			}
	    },

		require : function(queueObj,callback,async){
			var queueArr = [];
			for(var i in queueObj){
				!helper.loaded(i) && queueArr.push(queueObj[i]);
			}
			if(queueArr.length == 0 && typeof callback == 'function'){
				callback();
				return;
			}
			this.script(queueArr,callback,async);
		}//}}}
	};

	/**
	 * 基于jquery / easyXDM 的ajax请求
	 */
	var request = {
		//基于proxy 请求数据接口//{{{
		vresponse : function(succfn,failfn){
			return function(data){
				if(data.result.status.code == 0){
					succfn(data.result.data);
				}else{
					var status = data.result.status;
					failfn && failfn(status),
					helper.log("error.error.msg: " + status.msg);
				}
			}
		},
		header : function(){
			return {
				referer: doc.referer,
			}
		},
		_execute:function(uri,data,succfn,failfn,method){
			var data = data,
				url  = helper.isUrl(uri) ? uri : data.baseUrl + uri;
			proxy.request({
				url:url,
				method:method,
				data:data
			},
			function(response){
				try{
					(response.data && typeof response.data != 'object') && (response.data = helper.jsonDecode(response.data));
					request.vresponse(succfn,failfn)(response.data);
				}catch(e){ 
					helper.log(e); 
				}
			},
			failfn || function(){});
		},
		post : function(uri,data,succfn,failfn){
			this._execute(uri,data,succfn,failfn,'POST');
		},
		get : function(uri,data,succfn,failfn){
			this._execute(uri,data,succfn,failfn,'GET');
		},
		jsonp : function(uri,data,succfn,failfn){//to do :JSONP添加匿名函数
			var data = data; //succfn,此处为str
			data.callback = succfn;
			url = helper.isUrl(uri) ? uri : config.baseUrl + uri;
			!/\?/.test(url) && (url += '?');
			url += helper.buildQuery(data);
			request.script(url);
		}//}}}
	};

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

	var base = Fayhot.Class = function(){}; 
	var extend = function(instanceProps, staticProps){
		//继承拷贝//{{{
		var parent = this, child;
		if(instanceProps && helper.has(instanceProps, 'constructor')){
			child = instanceProps.constructor;
		}else{
			child = function(){ parent.apply(this, arguments); };
		}
		base.extend(child, parent, staticProps);
		var Surrogate = function(){ this.constructor = child; }; // 继承父类 prototype,不触发父类构造函数
		Surrogate.prototype = parent.prototype;
		child.prototype = new Surrogate;
		instanceProps && base.extend(child.prototype, instanceProps); //继承实例属性
		child.__super__ = parent.prototype; //添加父类引用
		return child;//}}}
	};

	/*******************************************************************************************************************************
	var bind = function(func, context) {//https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
		if(!helper.isFunction(func)) throw new TypeError;
		var aArgs = Array.prototype.slice.call(arguments, 2),
			fToBind = this,
			fNOP = function () {},
			fBound = function () {
				return fToBind.apply(this instanceof fNOP && context ? this : context, aArgs.concat(Array.prototype.slice.call(arguments)));
			};
		fNOP.prototype = func.prototype;
		fBound.prototype = new fNOP();
		return fBound;
	};
	********************************************************************************************************************************/
	/**
	 * 动态绑定上下文环境
	 * 事件委托时绑定执行上下文
	 */
	var bind = function(func, context) {
		//绑定上下文//{{{
		if(!helper.isFunction(func)) throw new TypeError;
		var bound, 
			args,
			slice = Array.prototype.slice;
		args = slice.call(arguments, 2);
		return bound = function() {
			if(!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
			var fnop = function(){};
			fnop.prototype = func.prototype;
			var self = new fnop;
			var result = func.apply(self, args.concat(slice.call(arguments)));
			return Object(result) === result ? result : self; 
		};//}}}
	};

	var _each = function(object, callback){
		// 遍历回调//{{{
		var name, i = 0,
			len = object.length,
			isObj = len === undefined || helper.isObject(object);

		if(isObj){
			for(name in object){
				if(callback.call(object[name], object[name]) === false){
					break;
				}
			}
		}else{
			for(; i < len ;){
				if(callback.call(object[i], object[i++]) === false){
					break;
				}
			}
		}
		return object; //}}}
	};

	base.extend = function(obj){
		_each(Array.prototype.slice.call(arguments, 1), function(source){
			for(var i in source){
				obj[i] = source[i];
			}
		});
		return obj;
	};

	/**
	 * model 类
	 */
	var model = function(attributes, options) {
		// model 类//{{{
		this.attributes = {};
		this._escapedAttributes = {};
		this.cid = helper.uniqueId('model');
		this.changed = {};
		this._changes = {};
		this._pending = {};
		this.set(attributes || {}, {silent: true});

		this.changed = {}; // 重置change状态
		this._changes = {};
		this._pending = {};
		this._previousAttributes = helper.clone(this.attributes);
		this.initialize.apply(this, arguments);//}}}
	};

	base.extend(model.prototype,{ //已改变属性hash表
		//model 原型扩展//{{{
		changed: null, //上次change事件中改变了的属性哈希表
		_changes: null, //上次change事件开始后发生改变的属性哈希表
		_pending: null,
		_changing : null,
		idAttribute: 'id',
		get: function(attr) {
			return this.attributes[attr];
		},
		initialize:function(){
		},
		has: function(attr) {
			return this.get(attr) != null;
		},
		set: function(key, val, options) {
			var attr, attrs;
			if (key == null) return this;
			if(helper.isObject(key)){
				attrs = key;
				options = val;
			}else{
				(attrs = {})[key] = val;
			}
			var silent = options && options.silent,//silent 不触发事件
				unset = options && options.unset;
			if(attrs instanceof model){
			   	attrs = attrs.attributes;
			}
			if(unset){
				for(attr in attrs){
					attrs[attr] = void(0);
				}
			}
			if(!this._validate(attrs, options)){
			   	return false;
			}
			if(this.idAttribute in attrs){
				this.id = attrs[this.idAttribute];
			}
			var changing = this._changing,
				now = this.attributes,
				escaped = this._escapedAttributes,
				prev = this._previousAttributes || {};

			for (attr in attrs) {
				val = attrs[attr];
				if (!helper.equal(now[attr], val) || (unset && helper.has(now, attr))){
					delete escaped[attr];
					this._changes[attr] = true;
				}
				unset ? delete now[attr] : now[attr] = val; // 更新或删除当前值

				if(!helper.equal(prev[attr], val) || (helper.has(now, attr) !== helper.has(prev, attr))){ // 跟踪记录属性变化,记录/移除属性change事件
					this.changed[attr] = val;
					!silent && (this._pending[attr] = true);
				}else{
					delete this.changed[attr];
					delete this._pending[attr];
					!changing && delete this._changes[attr];
				}
				changing && helper.equal(now[attr], changing[attr]) && delete this._changes[attr];
			}
			!silent && this.change(options); // 触发changing事件
			return this;
		},

		unset: function(attr, options) { // 移除model的属性,触发change事件
			options = $.extend({}, options, {unset: true});
			return this.set(attr, null, options);
		},
		clear: function(options) { // 清空所有的model属性,触发change事件
			options = $.extend({}, options, {unset: true});
			return this.set(helper.clone(this.attributes), options);
		},
		change: function(options) {
			var changing = this._changing;
			var current  = this._changing = {};
			for(var attr in this._changes){ // 指定silent的属性事件直接置为pending状态
				this._pending[attr] = true;
			}

			var changes = this._changes; // 触发属性变化事件
			this._changes = {};

			var triggers = []; // 设置_changing状态值
			for(var attr in changes){
				current[attr] = this.get(attr);
				triggers.push(attr);
			}

			for(var i=0, len = triggers.length; i < len ; i++){
				this.trigger('change:' + triggers[i], this, current[triggers[i]], options);
			}

			if(changing){
				return this;
			}

			while (!helper.isEmpty(this._pending)) { // pending changes触发change事件
				this._pending = {};
				this.trigger('change', this, options);
				for(var attr in this.changed){ // 保留pending & silent 变化
					if (this._pending[attr] || this._changes[attr]) continue;
					delete this.changed[attr];
				}
				this._previousAttributes = helper.clone(this.attributes);
			}
			this._changing = null;
			return this;
		},
		hasChanged: function(attr) {
			if (attr == null){
			   	return !helper.isEmpty(this.changed);
			}
			return helper.has(this.changed, attr);
		},
		changedAttributes: function(diff) { // 返回已改变的属性集合{},为空则为false 用于判定视图层的局部更新 Unset 属性置为undefined
			if(!diff) {
				return this.hasChanged() ? helper.clone(this.changed) : false;
			}
			var val, 
				changed = false, 
				old = this._previousAttributes;
			for(var attr in diff){
				if(helper.isEqual(old[attr], (val = diff[attr]))){
					continue;
				}
				(changed || (changed = {}))[attr] = val;
			}
			return changed;
		},
		previous: function(attr) {
			if (attr == null || !this._previousAttributes) return null;
			return this._previousAttributes[attr];
		},
		previousAttributes: function() {
			return helper.clone(this._previousAttributes);
		},
		isValid: function(options) {
			return !this.validate || !this.validate(this.attributes, options);
		},
		_validate: function(attrs, options) {
			if(options && options.silent || !this.validate){
				return true;
			}
			attrs = $.extend({}, this.attributes, attrs);
			var error = this.validate(attrs, options);
			if(!error){
				return true;
			}
			if(options && options.error){
				options.error(this, error, options);
			}
			this.trigger('error', this, error, options);
			return false;
		}//}}}
	},events);

	var view = function(options) {
		//view 类//{{{
		this.cid = helper.uniqueId('view');
		this._configure(options || {});
		this._ensureElement();
		this.initialize.apply(this, arguments);
		this.delegateEvents();//}}}
	};

	var delegateEventSplitter = /^(\S+)\s*(.*)$/,
		viewOptions = ['model','el', 'id', 'attributes', 'className', 'tagName']; //view层基本属性

	base.extend(view.prototype,{
		// view 原型扩展//{{{
		$:function(selector) {
			return this.$el.find(selector);
		},
		initialize:function(){
		},
		render:function() {
			return this;
		},
		dispose:function() {//释放资源
			this.undelegateEvents();
			if(this.model && this.model.off){
				this.model.off(null, null, this);
			}
			return this;
		},
		remove:function() {
			this.dispose();
			this.$el.remove();
			return this;
		},
		make:function(tagName, attributes, content) {
			var el = document.createElement(tagName);
			attributes && $(el).attr(attributes);
			(content != null) && $(el).html(content);
			return el;
		},
		setElement: function(element, delegate) { // 改变view层绑定的element,并重新委托事件
			this.$el && this.undelegateEvents();
			this.$el = element instanceof $ ? element : $(element);
			this.el = this.$el[0];
			(delegate !== false) && this.delegateEvents();
			return this;
		},
		delegateEvents: function(events) {//不兼容非委托事件　focus , blur , change , submit , reset
			events = $.extend(events || {},this.events || {});
			if(helper.isEmpty(events)) {
				return;
			}
			this.undelegateEvents();
			for(var key in events){
				var method = events[key];
				if(!helper.isFunction(method)){
				   	method = this[events[key]];
				}
				if(!method){
				   	throw new Error('Method "' + events[key] + '" does not exist');
				}
				var match = key.match(delegateEventSplitter),
					eventName = match[1], selector = match[2];
				method = bind(method, this);
				eventName += '.delegateEvents' + this.cid;
				if(selector === ''){
					this.$el.bind(eventName, method);
				}else{
					this.$el.delegate(selector, eventName, method);
				}
			}
		},
		undelegateEvents: function() {
			this.$el.unbind('.delegateEvents' + this.cid);
		},
		_configure: function(options) {
			if(this.options){
				options = $.extend({}, this.options, options);
			}
			$.extend(this, helper.filter(options, viewOptions));
			this.options = options;
		},
		_ensureElement: function() {
			if(!this.el){
				var attrs = $.extend({}, this.attributes);
				this.id && (attrs.id = this.id);
				this.className && (attrs['class'] = this.className);
				this.setElement(this.make(this.tagName, attrs), false);
			}else{
				this.setElement(this.el, false);
			}
		}//}}}
	},events);

	view.extend = model.extend = extend;

	json = function(type,uri,params){
		//json 类//{{{
		if(helper.isObject(uri)){
			this.uri = uri.uri || '';
			this.params = uri.params || {};
		}else{
			this.uri = uri || '';
			this.params = params || {};
		}
		this.data = {};
		this.type = type;//}}}
	};	

	base.extend(json.prototype,{
		//json 原型扩展//{{{
		uri : null,
		response: function(data) {
		},
		set:function(key , value){
			return  this.data = this.data || {} , helper.isObject(key) ? this.data = $.extend({},this.data,key) : this.data[key] = value, this;
		},
		prepare:function(){
			if(this.uri){
				var header = request.header();
				if(location.href){
					var hash = location.hash,
						href = location.href;
					header.url = hash ? href.replace(hash,'') : href;
				}
				this.set(header).set(config);
			}
		},
		jsonp:function(){
			this.prepare();
			request.jsonp(this.uri,this.data,"fayhot.Jsons['" + this.type + "'].response");
		},
		get:function(succfn,failfn){
			this.prepare();
			request.get(this.uri,this.data,succfn,failfn);
		},
		post:function(succfn,failfn){
			this.prepare();
			request.post(this.uri,this.data,succfn,failfn);
		}//}}}
	});
	
	/**
	 * 字典数据
	 */
	var dictionary = function(){
		//{{{
		var container = {}
			order = [];

		this.add = function(key, value) {
			if (!this.exists(key)) {
				container[key] = value;
				order.push(key);
			}
		};
		this.remove = function(key) {
			container[key] = null;
			var len = order.length;
			while (len-- > 0) {
				if (order[len] == key) {
					order[len] = null;
					break;
				}
			}
		};
		this.toString = function() {
			var output = [],
				length = order.length;
			for (var i = 0; i < length; i++) {
				(order[i] != null) && output.push(container[order[i]]);
			}
			return output;
		};
		this.getKeys = function() {
			var keys = [],
				length = order.length;
			for (var i = 0; i < length; i++) {
				(order[i] != null) && keys.push(order[i]);
			}
			return keys;
		};
		this.update = function(key, value) {
			(value != null) && (container[key] = value);
			var length = order.length;
			while (length-- > 0) {
				if (order[length] == value) {
					order[length] = null;
					order.push(value);
					break;
				}
			}
		};
		this.exists = function(key) {
			return container[key] != null;
		};//}}}
	};

	/**
	 * 集合数据
	 */
	var collection = function(){
		//{{{
		var items = [],
			itemType = null,
			index = 0;//迭代器
		var typeCheck = function(item){
			if(itemType && itemType !== Fayhot.typeOf(item)){
				throw new Error("type mismatch for collection and item " + itemType + " != " + Fayhot.typeOf(item));
			}
			return true;
		};
		var emptyCheck = function(){
			items.length == 0  && (itemType = null);
		};
		this.size = this.count = function(){
			return items.length;
		};
		this.isEmpty = function(){
			return this.size() === 0;
		};
		this.current = function(){
			return items[index];
		};
		this.first = function(){
			return items[0];
		};
		this.last = function(){
			return items[items.length - 1];
		};
		this.reset = function(){
			index = 0;
		};
		this.next = function(){
			var item = null;
			this.hasNext() && (item = items[++index]);
			return item;
		};
		this.hasNext = function(){
			return index + 1 < items.length ;
		};
		this.each = function(callback){
			for(var i = 0 , len = items.length ; i < len ; i ++){
				callback(items[i]);
			}
		};
		this.add = function(item){
			if(!itemType){
				itemType = Fayhot.typeOf(item);
				items.push(item);
			}else{
				typeCheck(item) && items.push(item);
			}
		};
		this.contains = function(item){
			if(!itemType || Fayhot.typeof(item) !== itemType){//两者都未null时,也认为是false
				return false;
			}
			for(var i = 0 , len = items.length ; i < len ; i++){
				if(helper.equal(item,items[i])){
					return true;
				}
			};
		};
		this.remove = function(item){
			var index = items.indexOf(item);
			index >= 0 && items.splice(index,1);
			emptyCheck();
		};
		this.remoteAt = function(index){
			index >= 0 && index < items.length && items.splice(index,1);
			emptyCheck();
		};
		this.clear = function(){
			items = [],
			itemType = null;
		};
		this.get = function(index){
			return items[index];
		};
		this.toString = this.toArray = function(){
			var output = [],
				length = items.length;
			for (var i = 0; i < length; i++) {
				output.push(items[i]);
			}
			return output;
		};//}}}
	};

	/**
	 * 迭代器
	 * todo 针对 collection dictionary 做 分支处理
	 */
	var iterator = function(target, assoc){
		//{{{
		if(!(this instanceof arguments.callee))
		  return new arguments.callee(target, assoc);
		var index = 0, 
			keys = [];
		if(!target || typeof target != "object") 
			return;
		if(helper.isArray(target)) {
			while(keys.length < target.length) keys.push(keys.length);
		} else {
			for(prop in target){
			   	target.hasOwnProperty(prop) && keys.push(prop);
			}
		}
		this.next = function next() {
			if(index < keys.length) {
				var key = keys[++index];
				return !assoc ? key : [key, target[key]];
			} else{
			   	throw { name: "StopIteration" };
			}
		};
		this.current = function(){
			var key = keys[index];
			return !assoc ? key : [key, target[key]];
		};
		this.reset = function(){
			index = 0;
		};
		this.first = function(){
			var key = keys[0];
			return !assoc ? key : [key, target[key]];
		};
		this.last = function(){
			var key = keys[keys.length - 1];
			return !assoc ? key : [key, target[key]];
		};
		this.hasNext = function hasNext() {
			return index + 1 < keys.length;
		};//}}}
	};
	
	Fayhot.Collection = collection;
	Fayhot.Dictionary = dictionary;
	Fayhot.Iterator   = iterator;
	Fayhot.helper = helper;
	Fayhot.config = config;
	Fayhot.load   = load;
	Fayhot.Model  = model;
	Fayhot.View   = view;
	Fayhot.Json   = json;
    win.Fayhot = Fayhot;
})(window);
