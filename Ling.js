(function(){
var Ling = {
  version : '0.7',
  urls : [],
  modules:{},
  stacks:[]
};

Ling.error = function(str){
  throw new Error(str);
}

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(O) {
    for (var i = 0, len = this.length ; i < len ; i++)
      if(this[i] == o)
        return i;
    return -1;
  }
}

/**
 * @description 遍历当前object
 * @param object object
 * @param function callback
 * @param boolean flag 匹配false则直接break
 * @return boolean
 */
var _each = function(object, callback, flag){
  var name,
      i = 0,
      len = object.length,
      isObj = len === undefined || IsObject(object, true),
      flag = flag || false,
      ret = true;

  if (isObj) {
    for(name in object) {
      if(callback.call(null, name, object[name]) === false) {
        ret = false;
        if (flag) break;
      }
    }
  } else {
    for(; i < len ;) {
      if(callback.call(null, i, object[i++]) === false) {
        ret = false;
        if (flag) break;
      }
    }
  }
  return ret;
};

Ling.noop = function() {};
Ling.fn = function(o){
  return function(){
    return o;
  }
}

var _logReg = Ling.logReg || /.*/;

var doc = document;

var win = window;

var head = doc.getElementsByTagName('head')[0] || doc.documentElement;

var _count_id = 0;


Ling.debug = false;

var _prefix = 'cb';

function getUniueId(prefix) {
  _count_id ++;
  return (prefix || _prefix) + _count_id;
}

//Ling.getUniueId = getUniueId;

function IsObject(o,strict) {
  if (!!strict && Object.prototype.toString.call(o) === '[object Array]')
    return false;
  return o !== null && typeof o === 'object';
};

function IsArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}

function IsFunction(o) {
  return Object.prototype.toString.call(o) === '[object Function]';
}

Ling.log = function() {//{{{
  if (!Ling.debug || !(win.console && win.console.log))
    return;
  !_logReg && (_logReg = Ling.logReg);
  var args = [],
      len = arguments.length;
  if (len < 1)
    return;

  var logKey = arguments[len - 1];

  if (!_logReg || _logReg.test(logKey)) {
    for(var i = 0 ; i < len ; i ++)
      args.push(arguments[i]);
    console.log.apply(console,args);
  }
  return true;
};//}}}


function getCurrentScript() {//{{{
  //取得正在解析的script节点
  if (doc.currentScript) { //firefox 4+
    return doc.currentScript.src;
  }
  // 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
  var stack;
  try {
    a.b.c(); //强制报错,以便捕获e.stack
  } catch (e) { //safari的错误对象只有line,sourceId,sourceURL
    stack = e.stack;
    if (!stack && window.opera) {
      //opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
      stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
    }
  }
  if (stack) {
    /**e.stack最后一行在所有支持的浏览器大致如下:
     *chrome23:
     * at http://113.93.50.63/data.js:4:1
     *firefox17:
     *@http://113.93.50.63/query.js:4
     *opera12:http://www.oldapps.com/opera.php?system=Windows_XP
     *@http://113.93.50.63/data.js:4
     *IE10:
     *  at Global code (http://113.93.50.63/data.js:4:1)
     */
    stack = stack.split(/[@ ]/g).pop(); //取得最后一行,最后一个空格或@之后的部分
    stack = stack[0] === "(" ? stack.slice(1, -1) : stack;
    return stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
  }
  var nodes = head.getElementsByTagName("script"); //只在head标签中寻找
  for (var i = 0, node; node = nodes[i++]; ) {
    if (node.readyState === "interactive")
      return node.src;
  }
};//}}}

var STATUS = {
  PENDING : 0,
  FETCHING : 1,
  EXECUTING : 2,
  LOADED : 3,
  FIRING : 4,
  FIRED : 5,
};

var TYPES = {
  JS : 1,
  CSS : 2,
  CALLBACK : 3
};

var SCRIPTS = {
  JS : '.js',
  CSS : '.css'
}

var _TYPES = {
  '.js' : TYPES.JS,
  '.css' : TYPES.CSS,
  'callback' : TYPES.CALLBACK
}

var _dirRg = /\/[^\/]*\/?$/;

var nodes = doc.getElementsByTagName('script');

var loader = doc.getElementById('Lingnode') || nodes[nodes.length - 1];

/// see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
function getNodeSrc(node) {
  return node.hasAttribute ? node.src : node.getAttribute('src', 4).replace(/[?#].*/, '');
}

//ref phpjs.org
function dirname (path) {
  return path.replace(/\\/g, '/').replace(_dirRg, '');
}

var baseUrl = dirname(getCurrentScript()) + '/';

function require(list, fn) {
  var list = typeof list === 'string' ? [list] : list,
      guid = getUniueId(),
      result = parseDeps(list, baseUrl),
      modules = Ling.modules;
  modules[guid] = {
    name : guid,
    type : TYPES.CALLBACK,
    status : STATUS.LOADED,
    deps : result.deps,
    factory : fn,
    exports : {}
  };

  if (result.urls.length)
    (function(urls){
      load.fetch(urls, function(){
        _each(urls, function(i, url){
          if (modules[url]['status'] < STATUS.LOADED)
            modules[url]['status'] = STATUS.LOADED;
          if (TYPES.CSS == modules[url]['type'])
            fire(url);
        });
      });
    })(result.urls);
  else
    fire(guid);
  return true;
}

function define(id, deps, factory) {//{{{
  var argslen = arguments.length;
  if (argslen == 1)
    IsFunction(id) ? (deps = [], factory = id) : (deps = [], factory = Ling.fn(id));
  else if (argslen == 2)
    IsArray(id) ? (factory = deps, deps = id) : (factory = deps, deps = []);
  else
    IsArray(deps) || (deps = [deps]);
  id = getCurrentScript();

  var handle = function(id, deps, factory){
    var modules = Ling.modules;
    modules[id].factory = factory;
    modules[id].status = STATUS.FETCHING;
    if (!deps.length) {
      fire(id);
    } else {
      result = parseDeps(deps, id, true);
      (function(urls){
        load.fetch(urls, function(){
          _each(urls, function(i, url){
            if (modules[url]['status'] < STATUS.LOADED)
              modules[url]['status'] = STATUS.LOADED;
            if (TYPES.CSS == modules[url]['type'])
              fire(url);
          });
        });
      })(result.urls);
    }
  }
  if (!id)
    Ling.stacks.push(function(deps, factory){
      Ling.error("get current script error");
      return function(id){
        handle(id, deps, factory);
        id = null; deps = null; factory = null;
      }
    }(deps, factory));
  else
    handle(id, deps, factory);
}//}}}

/**
 * 解析模块依赖列表
 * @param boolean _flag 是否检查循环依赖
 * @return object
 */
function parseDeps(list, _base, _flag) {//{{{
  var modules = Ling.modules,
      urls = [],
      deps = [],
      id,
      result;
  while (id = list.shift()) {
    if (modules[id]) {
      deps.push(id);
      continue;
    }
    result = id2url(id, _base);
    modules[_base] && (modules[_base].deps.indexOf(result[1] == -1)) && modules[_base].deps.push(result[1]);
    _flag && parseCircularDeps(result[1], _base) && Ling.error('模块[url:'+ _base +']与模块[url:'+ result[1] +']循环依赖');
    if (modules[result[1]]) {
      deps.push((result[1]));
      continue;
    }
    Ling.urls.push(result[1]);
    modules[result[1]] = {
      name : result[0],
      type : result[2],
      status : STATUS.PENDING,
      exports : {},
      deps : [],
      factory : Ling.noop
    }
    if (result[2] == TYPES.JS || result[2] == TYPES.CSS)
      deps.push(result[1]);
    urls.indexOf(result[1]) == -1 && urls.push(result[1]);
  }
  return {
    deps : deps,
    urls : urls
  }
}//}}}

function id2url(id, _base) {//{{{
  var url,
      result,
      _dir,
      paths,
      type,
      module,
      _protocolRg = /^(\w+\d?:\/\/[\w\.-]+)(\:\d+)?(\/(.*))?/;

  if (result = _protocolRg.exec(id)) {
    url = id;
    paths = result[4] ? result[4].split('/') : [];
  } else {
    result = _protocolRg.exec(_base);
    url = result[1] + (result[2] ? result[2] : '');
    paths = result[4] ? result[4].split('/') : [];
    modules = id.split('/');
    paths.pop();
    for (var i = 0, len = modules.length; i < len; i ++) {
      _dir = modules[i];
      if (_dir == '..')
        paths.pop();
      else if (_dir !== '.')
        paths.push(_dir);
    }
    url = [url, '/', paths.join('/')].join('');
  }
  module = paths[paths.length - 1];
  _type = module.slice(module.lastIndexOf('.')).toLowerCase();

  if (_type !== SCRIPTS.JS && _type !== SCRIPTS.CSS)
    type = TYPES.JS, url += SCRIPTS.JS;
  else
    type = _TYPES[_type];
  return [module, url, type];
}//}}}

function parseCircularDeps(id, dependencie){
  var modules = Ling.modules,
      depslist = modules[id] ? modules[id].deps : [];
  return depslist.indexOf(dependencie) != -1;
}

/**
 * 异步加载资源文件
 */
var load = {//{{{
  styleSheet : function(href,callback){
                 var link  = doc.createElement("link");
                 link.type = "text/css",
                   link.rel  = "stylesheet",
                   link.href = href;
                 head.appendChild(link);
                 callback instanceof Function ? callback() : '';
               },

  style : function(cssText,callback){
            var style = doc.createElement("style"),
            cssText = cssText.replace(/\}/g, "}\n");
            style.type = "text/css";
            style.styleSheet ?
              style.styleSheet.cssText = cssText :
              style.appendChild(doc.createTextNode(cssText));
            head.appendChild(style);
            callback instanceof Function ? callback() : '';
          },

  script : function(scripts,callback,async){//todo : 添加回调模型,重用异步加载js的代码
             IsArray(scripts) || (scripts = [scripts]);
             if(async === true){
               var s = new Array() , loaded = 0;
               for (var i = 0, len = scripts.length ; i < len ; i ++) {
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
             } else {
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

  fetch : function(list, callback, async) {
            if (0 == list.length)
              if (IsFunction(callback))
                return callback(), true;
              else
                return true;
            var dict = {"js":[], "css":[]},
                map = {"js":"script", "css":"styleSheet"};

            _each(list, function(i, url) {
              var _type = url.slice(url.lastIndexOf('.') + 1).toLowerCase();
              dict[_type].push(url);
            });

            _each(dict, function(type, list){
              list.length && load[map[type]](dict[type], callback, async);
            });
          }
};//}}}

/**
 * fire factory
 * @param  {String} uuid
 */
function fire(uuid){
  var modules = Ling.modules,
      module = modules[uuid],
      deps = module.deps,
      args = [];
  if (STATUS.FIRED == module.status)
    return broadcast(), true;
  Ling.log(uuid, 'fire');
  for(var i = 0, len = deps.length; i < len; i++)
    args.push(modules[deps[i]].exports);
  module.status = STATUS.FIRING;
  module.exports = module.factory.apply(null, args);
  module.status = STATUS.FIRED;
  //Ling.log(uuid, 'fire');
  //if (module.type == TYPES.CALLBACK) delete modules[uuid];
  return broadcast(), true;
}

/**
 * 广播
 */
function broadcast(){
  _each(Ling.modules, function(id, module){
    if (module.status != STATUS.FIRED && module.status >= STATUS.LOADED && chainFire(id))
      fire(id);
  });
}

function chainFire(id) {
  var modules = Ling.modules,
      module = modules[id],
      deps = module.deps,
      flag = true;

  Ling.log('check-chain:id-->',id, ' [status:'+module.status,'] [type:'+module.type,'] deps-->',module.deps, deps.length, 'check-chain');
  return _each(deps, function(index, id){
    var module = Ling.modules[id];
    if (STATUS.FIRED == module.status)
      return true;
    return false;
  }, true);
}

/**
 * 心跳
 */
var _beat_interval = 100;

function beat() {
  var _bt = setInterval(function(){
    if (_each(Ling.modules, function(i, module){
      return module.status == STATUS.FIRED;
    }, true)) clearInterval(_bt);
    broadcast();
  }, _beat_interval);
};

Ling.load = load;
win.define = Ling.define = define;
win.require = Ling.require = require;
Ling.beat = beat;
win.Ling = Ling;
})(window);
