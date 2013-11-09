~(function(win){
    win.console = win.console || {log:function(){}};
})(window);

~(function(win){
	var CK = {//{{{
		get:function(name){
			var tmp,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)","gi");
			return (tmp=reg.exec(document.cookie))?(unescape(tmp[2])):null;
		},
		set:function(name,value,expired){
			var exp  = new Date();
			expired = expired || 3600 * 24;
		    exp.setTime(exp.getTime() + expired*1000);
		    document.cookie = name + "="+ escape(value) +";expires="+ exp.toGMTString();
			return true;
		},
		del:function(name){
			return this.set(name,'',-1);
		}
	};
	win.CK = CK;//}}}
})(window);

~(function(win){//检测浏览器,包括
	var NV = {},//{{{
		UA = win.navigator.userAgent.toLowerCase();
	try {
		NV.name = !!win.ActiveXObject ? 'ie': (UA.indexOf("firefox") > 0) ? 'firefox': (UA.indexOf("chrome") > 0) ? 'chrome': window.opera ? 'opera': window.openDatabase ? 'safari': '';
	} catch(e) {};
	try {
		NV.version = (NV.name == 'ie') ? UA.match(/msie ([\d.]+)/)[1] : (NV.name == 'firefox') ? UA.match(/firefox\/([\d.]+)/)[1] : (NV.name == 'chrome') ? UA.match(/chrome\/([\d.]+)/)[1] : (NV.name == 'opera') ? UA.match(/opera.([\d.]+)/)[1] : (NV.name == 'safari') ? UA.match(/version\/([\d.]+)/)[1] : '0';
	} catch(e) {};
	try {
		NV.shell = (UA.indexOf('360ee') > -1) ? '360ee'
		: (UA.indexOf('360se') > -1) ? '360se'
		: (UA.indexOf('se') > -1) ? 'sogou'
		: (UA.indexOf('aoyou') > -1) ? 'aoyou'
		: (UA.indexOf('theworld') > -1) ? 'theword'
		: (UA.indexOf('worldchrome') > -1) ? 'worldchrome'
		: (UA.indexOf('greenbrowser') > -1) ? 'greenbrowser'
		: (UA.indexOf('qqbrowser') > -1) ? 'qqbrowser'
		: (UA.indexOf('baidu') > -1) ? 'baidu'
		: '';
	} catch(e) {}
	win.NV = NV;//}}}
})(window);

~(function(win){
	var template = {//{{{
		cache : {},//{{{
		regcache :{},
		regexp : function(){
			var left  = this.left,<!--{{{-->
				right = this.right,
				cacheid = this.left +  this.right;
			if(this.regcache[cacheid]){
				return this.regcache[cacheid];
			}
			var map = {
					"$" : "\\$",
					"(" : "\\(",
					")" : "\\)",
					"*" : "\\*",
					"+" : "\\+",
					"[" : "\\[",
					"]" : "\\]",
					"?" : "\\?",
					"\\": "\\\\",
					"^" : "\\^",
					"{" : "\\{",
					"}" : "\\}",
					"|" : "\\|"
				},
				reg = /[\$\(\)\*\+\[\]\?\\\^\{\}\|]/g,
				fn = function(quote) {
					return map[quote];
				},
				encleft  = reg.test(left) ? left.replace(reg, fn) : left,
				encright = reg.test(right) ? right.replace(reg, fn) : right,
				str = "([\\s'\\\\])(?!"+encright+")|(?:" + encleft + "(=|#|~)([\\s\\S]+?)" + encright +")|(" + encleft + ")|(" + encright +")";
			return  this.regcache[cacheid] = new RegExp(str,"g"),this.regcache[cacheid];<!--}}}-->
		},
		left :'{%',
		right:'%}',
		ref  :'data',
		debug:false,
		version : '0.9',
		isObject : function(o,strict){ //判断是否是Object类型
			if(!!strict){
				if(Object.prototype.toString.call(o) === '[object Array]'){
					return false;
				}
			}
			return o !== null && typeof o === 'object';
		},
		encode : function(){ //字符替换
			var map = {//{{{
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#x27;",
				"`": "&#x60;",
				'/': '&#x2f;'
			},
			rep = /&(?!\w+;)|[<>"'`]/g,
			reg = /[&<>"'`\x00]/,
			fn = function(quote) {
				return map[quote] || "&amp;"
			};
			return function(str) {
				return str == null || str === false ? "": reg.test(str) ? str.replace(rep, fn) : str;
			}//}}}
		}()//}}}
	};
	template.compile = function (str, data) {
		var fn = function(){//{{{
			var r = t = null;
			if(this.cache[str]){
				return this.cache[str];
			}else if(!/[^\w\-\.]/.test(str)){
				var ele = document.getElementById(str),
					t = /^(textarea|input)$/i.test(ele.nodeName) ? ele.value : ele.innerHTML;
			}else{
				t = str;
			}
			try{
				r = this.parse(t);
			}catch(e){ }
			return r;
		}.apply(this);
		return this.isObject(data) ? fn(data, template) : function (data) {
				return fn(data, template);
		};//}}}
	};

	template.parse = function(str){
		try{//{{{
			var _param = this.ref + ',t',
				_code  = "var _e=t.encode" + this.helper + ",_s='" + str.replace(this.regexp(), this.filter) + "';return _s;";
				_body  = "try{ " + _code + "} catch (e) { throw e; }";
			try{
				return Function.call(this, _param,_body);
			}catch(e){ }
		}catch(e){ } //}}}
	};

	template.filter = function (match, p1, p2, p3, p4, p5) {
		if (p1) { // [\s'\\]//{{{
			return {
				"\n": "\\n",
				"\r": "\\r",
				"\t": "\\t",
				" " : " "
			}[match] || "\\" + match;
		}
		if (p2) { //(?!\{%(=|#)})
			if (p2 === "=") {
				return "'+_e(" + p3 + ")+'";
			}else if(p2 === "#"){
				return "'+(" + p3 + "||'')+'";
			}else if(p2 === "~"){
				return "'+" + p3 + "+'";
			}
		}
		if (p4) { // \{%
			return "';";
		}
		if (p5) { // %\}
			return "_s+='";
		}//}}}
	};
	template.helper = ",print=function(s,f){_s+=f&&(s||'')||_e(s);}" + ",include=function(s,d){_s+=template.compile(s,d);}" + ",log=function(){console.log.apply(console, arguments)}" + ",st='',debug=function(cb){if(!template.debug)return;var l=st.length;st=_s;cb(_s);}";
	win.template = template;//}}}
})(window);

~(function(win,undefined){
//{{{
	var helper = {
		buildQuery : function(formdata, separator){//{{{
			if(typeof formdata === 'string'){
				return formdata;
			};
			var tmp = [];
			var buildHelper = function (key, val, separator){
				var _tmp = [];
				if(val != null){
					if(typeof val === "object"){
						for(var k in val){
							val[k] && (_tmp.push(buildHelper(key + "[" + k + "]", val[k], separator)));
						}
						return _tmp.join(separator);
					}else if(typeof val !== "function"){
						return enccpt(key) + "=" + enccpt(val);
					}else{
						throw new Error('function param not supported');
					}
				}else{
					return key + "=";
				}
			};
			!separator && (separator = "&");
			for(var key in formdata) {
				var value = formdata[key], 
					query = buildHelper(key, value, separator);
				query != '' && tmp.push(query);
			}
			return tmp.join(separator);
		},
		keys:function (o, search_value, argStrict){
			var search = typeof search_value !== 'undefined',
				arr = [],
				strict = !!argStrict,
				include = true,
				key = '';
			for (key in o) {
				if (o.hasOwnProperty(key)){
					include = true;
					if (search) {
						if (strict && o[key] !== search_value){
							include = false;
						} else if (o[key] != search_value) {
							include = false; 
						} 
					}
					include && arr.push(key); 
				} 
			} 
			return arr;
		},
		filter:function(o,filter){
			if(!(this.isObject(o) && this.isArray(filter))){
				return {};
			}
			var obj = {},
				t = null;
			for(var i in filter){
				t = filter[i];
				if(!(this.isNumber(t) || this.isString(t)) || !filter.hasOwnProperty(i) || !t){
					continue;
				}
				obj[t] = o[t];
			}
			return obj;
	    },
		subString:function(str, length){
			var charLength = 0,
				item = null,
				subLen = 0;
			for(var i = 0 , len = str.length ;  i < len ; i++){
				item = str.charAt(i);
				encurl(item).length > 2 ? charLength += 1 : charLength += 0.5;
				if(charLength >= length){
					subLen = charLength == len ? i+1 : i;
					str = str.substring(0,subLen);
					break;
				}
			}
			return str;
		},
		strlen:function(str , integer){
			integer = integer || false;
			if(typeof str === 'string'){
				var count = 0;
				for(var i = 0 , len = str.length ; i < len ; i ++){
					item = str.charAt(i);
					encurl(item).length > 2 ? count += 1 : count += 0.5;
				}
				return integer ? Math.ceil(count) : count;
			}
			return 0;
		},
		stripTags:function(input,allowed){
			allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
			var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
			commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
			return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
				return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
			});
	    },
		isObject : function(o,strict){ //判断是否是Object类型
			if(!!strict){
				if(Object.prototype.toString.call(o) === '[object Array]'){
					return false;
				}
			}
			return o !== null && typeof o === 'object';
	    },
		isFunction:function(o){
			return Object.prototype.toString.call(o) == '[object Function]';
	    },
		isNumber:function(o){
			return Object.prototype.toString.call(o) == '[object Number]';
		},
		isUrl:function(url){ 
			return /^https?\:\/\//.test(url);
	    },
		isset:function(o){
			return typeof o !== 'undefined';
	    },
		isArray:function(o) {
			return Object.prototype.toString.call(o) == '[object Array]';
		},
		inArray:function(ele,arr,strict){
			var i = null,
				strict = !!strict;
			if(strict){
				for(k in arr){
					if(arr[k] === ele) {
						return true;
					}
				}
			}else{
				for(k in arr){
					if(arr[k] == ele) {
						return true;
					}
				}
			}
			return false;
		},
		toggleArray:function(arr,ele,mod){
			if(!this.isArray(arr) || ele === undefined || ele === null){
				return false;
			}
			var equ = has = false,
				opt = 0,
				temp = [];
			for(var i in arr){
				arr.hasOwnProperty(i) && (arr[i] === ele ? has = true : temp.push(arr[i]));
			}
			!mod && (mod = 'toggle');
			if(mod == 'toggle'){
				!has && temp.push(ele);
			}else if(mod == 'add'){
				temp.push(ele);
			}else if(mod == 'remove'){
				//do nothing
			}
			return temp;
		},
		isString:function(o){
			return Object.prototype.toString.call(o) == '[object String]';
		},
		isEmpty:function(o) {
			if (o == null) {
				return true;
			}
			if(this.isArray(o) || this.isString(o)){
				return o.length === 0;
			}
			for(var k in o) {
				if(this.has(o,k)){
					return false;
				}
			}
			return true;
		},
		isHostMethod : function (o, property){
			var t = typeof o[property];
			return t == 'function' || (!!(t == 'object' && o[property])) || t == 'unknown';
		},
		has:function(o,attr){
			return Object.prototype.hasOwnProperty.call(o,attr);
		},
		equal:function(a,b){
			if(typeof a != typeof b){
				return false;
			}
            if(a instanceof Array){
                 if(!(b instanceof Array)){
                     return false;
                 }
                 var aLen = a.length,
                     bLen = b.length;
                 if(aLen != bLen){
                     return false;
                 }
                 var isEqual = true,num = 0;
                 for(var i = 0;i < aLen;i++){
                     if(a[i] != b[i] && typeof a[i]=='object' && typeof b[i]=='object'){
                       isEqual = arguments.callee(a[i],b[i]);
                     }else{
                       isEqual = a[i] === b[i];
                     }
                     isEqual && num++;
                 }
				 return num != aLen ? false : true;
             }else if(a instanceof Date){
                 if(!(b instanceof Date)){
                     return false;
                 }else{
                     return a.getTime() == b.getTime();
                 }
             }else if(a instanceof Object){
                 if((b instanceof Array) || (b instanceof Date) || !(b instanceof Object)){
                     return false;
                 }else{
                    var aLen=bLen=0;
                    for(var i in a){
                         aLen++;
                    }
                    for(var i in b){
                         bLen++;
                    }
                    if(aLen != bLen){
                         return false;
                    }
                    var isEqual = true,num = 0;
                    for(var i in a){
                      if(typeof a[i] == 'object' && typeof b[i] == 'object' && a[i] != b[i]){
                         isEqual = arguments.callee(a[i],b[i]);
                      }else{
                         isEqual = a[i] === b[i];
                      }
                      isEqual && num++;
                    }
					return num != aLen ? false : true;
                 }
             }else{
                 if(b instanceof Object){
                     return false;
                 }else{
                     return a === b;
                 }
             }
		},
		clone:function(o){
			if(!this.isObject(o)){
			   	return o;
			}
			return this.isArray(o) ? o.slice() : $.extend({}, o);
		},
		trim:function(str){
			return str.replace(/^[\s\u3000]*|[\s\u3000]*$/g,"");
		},
		uniqueId:function(){
			var idCounter = 0;
			return function(prefix){
				var id = ++idCounter;
				return prefix ? prefix + id : id;
			}
		}(),
		htmlEncode:function(){
			var map = {
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#x27;",
				"`": "&#x60;",
				'/': '&#x2f;'
			},
			rep = /&(?!\w+;)|[<>"'`]/g,
			reg = /[&<>"'`]/,
			fn = function(quote) {
				return map[quote] || "&amp;"
			};
			return function(str) {
				return str == null || str === false ? "": reg.test(str) ? str.replace(rep, fn) : str;
			}
		}(),
		fn : function(o){
			return function(){
				return o;
			}
		},
		placeHolder:function($dom){
			if($.browser.msie){
				$target = $dom || $("textarea[placeholder]");
				$target.each(function(i,ele){
					var value = helper.trim(ele.value);
					if( value == '' || value == '点评下吧 ...'){
						ele.value = ele.getAttribute('placeholder');
					}
					$self = $(ele);
					$self.focus(function(){
						var $self = $(this),
							placeholder = $self.attr('placeholder'),
							value = $self.val();
						if(value == placeholder || value == '点评下吧 ...'){
							$self.val('');
						}
					}).blur(function(){
						var $self = $(this),
							placeholder = $self.attr('placeholder');
						if($self.val() == ''){
							$self.val(placeholder);
						}
					});
				})
			}
		},
		parseDate: function(d){
			return d.parse("1990-10-01T22:00:00+08:00") && function(time){
				return new d(time);
			} || d.parse("1990/10/01T22:00:00+0800") && function(time){
				return new d(time.replace(/-/g, "/").replace(/:(\d\d)$/, "$1"));
			} || d.parse("1990/10/01 22:00:00+0800") && function(time){
				return new d(time.replace(/-/g, "/").replace(/:(\d\d)$/, "$1").replace("T", " "));
			} || function(time){
				return new d(time);
			}
		} (Date)//}}}
	};

	helper.fullTime = function(time){
		var d = this.parseDate(time);
		return d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日" + d.toLocaleTimeString();
	};
	helper.elapsedTime = function(time){
		var past = this.parseDate(time), now = new Date, diff = (now - past) / 1e3;
		return diff < 10 ? "刚刚": diff < 60 ? Math.round(diff) + "秒前": diff < 3600 ? 
			   Math.round(diff / 60) + "分钟前": diff < 86400 ? Math.round(diff / 3600) + "小时前": 
			   (now.getFullYear() == past.getFullYear() ? "": past.getFullYear() + "年") + (past.getMonth() + 1) + "月" + past.getDate() + "日" + "&nbsp" + past.getHours() + ":" + past.getMinutes();
	};
	helper.log = function(msg){
		this.isHostMethod(win,'console') && (console.log(msg));
	};
	helper.localStorage = function(){
	   	return this.isHostMethod(win,'localStorage');
	};
	helper.jsonDecode = (function (){
		var json = win.JSON;
		if(this.isHostMethod(win,'JSON') && this.isHostMethod(json,'parse')){
			return function(jsonstr){
				try{ 
					return json.parse(jsonstr);
				}catch(err){ 
					if(!(err instanceof SyntaxError)){ 
						throw new Error('Unexpected error type in json_decode()'); 
					} 
					return null;
				}
			}
		}else{
			var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, j;
			return function(jsonstr){
				cx.lastIndex = 0;
				if(cx.test(jsonstr)) { 
					jsonstr = jsonstr.replace(cx, function (a) { 
						return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4); 
					}); 
				}
				if((/^[\],:{}\s]*$/).test(jsonstr.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))){ 
					j = eval('(' + jsonstr + ')');
					return j;
				}
				return null;
			}
		}
	}).apply(helper);

	helper.loaded = function(plugin){
		if(plugin == 'jQuery'){
			return this.isHostMethod(win,plugin) && jQuery.fn.jquery >= '1.7';//依赖于on method
		}else{
			return this.isHostMethod(win,plugin);
		}
	};

	window.helper = helper;//}}}
})(window);
