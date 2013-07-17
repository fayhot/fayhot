//博客园里看到的一个关于amd规范的实现，试用了下，还不错. mark下
;(function(win, undefined){
     win = win || window;
     var doc = win.document || document,
         head = doc.head || doc.getElementsByTagName("head")[0],
         fragment = document.createDocumentFragment(),
         hasOwn = Object.prototype.hasOwnProperty,
         slice = Array.prototype.slice,
         configure = {total : 4},
         basePath = (function(nodes){
             var node, url;
             if(!configure.baseUrl){
                 node = nodes[nodes.length - 1];
                 url = (node.hasAttribute ? node.src : node.getAttribute("src", 4)).replace(/[?#].*/, "");
             }else{
                 url = configure.baseUrl;
             }
             return url.slice(0, url.lastIndexOf('/') + 1);
         }(doc.getElementsByTagName('script'))),
         _sae = win.sae;
 
     /**
      * 框架入口
      */
     function sae(exp, context){
         return new sae.prototype.init(exp, context);
     }
     
     sae.prototype = {
         constructor : sae,
 
         /**
          * 初始化
          * @param {All} expr 
          * @param {All} context
          * @return {Object}
          * 
          */
         init : function(expr, context){
             if(typeof expr === 'function'){
                 require('ready', expr);
             }
             //TODO
         }
     }
     sae.fn = sae.prototype.init.prototype = sae.prototype;
 
     /**
      * 继承方法
      */
     sae.fn.extend = sae.extend = function(){
         var args = slice.call(arguments), deep = typeof args[args.length - 1] == 'bollean' ? args.pop() : false;
         
         if(args.length == 1){
             args[1] = args[0];
             args[0] = this;
             args.length = 2;
         }
 
         var target = args[0], i = 1, len = args.length, source, prop;
         
         for(; i < len; i++){
             source = args[i];
             for(prop in source){
                 if(hasOwn.call(source, prop)){
                     if(typeof source[prop] == 'object'){
                         target[prop] = {};
                         this.extend(target[prop],source[prop]);
                     }else{
                         if(target[prop] === undefined){
                             target[prop] = source[prop];
                         }else{
                             deep && (target[prop] = source[prop]);
                         }
                     }
                 }
             }
         } 
     };
 
     /**
      * mix
      * @param  {Object} target   目标对象
      * @param  {Object} source   源对象
      * @return {Object}          目标对象
      */
     sae.mix = function(target, source){
         if( !target || !source ) return;
         var args = slice.call(arguments), i = 1, override = typeof args[args.length - 1] === "boolean" ? args.pop() : true, prop;
         while ((source = args[i++])) {
             for (prop in source) {
                 if (hasOwn.call(source, prop) && (override || !(prop in target))) {
                     target[prop] = source[prop];
                 }
             }
         }
         return target;
     };
 
     sae.mix(sae, {
         modules : {               //保存加载模块
             ready : {
                 state : 1,
                 type : 1,
                 args : [],
                 exports : sae
             }
         },
         urls : [],
         loading : 0,
         stacks : [],             //getCurrentScript取不到值的时候用来存储当前script onload的回调函数数组
 
         /**
          * get uuid
          * @param {String} prefix
          * @return {String} uuid
          */
         guid : function(prefix){
             prefix = prefix || '';
             return prefix + (+new Date()) + String(Math.random()).slice(-8);
         },
 
         /**
          * noop 空白函数
          */
         noop : function(){
 
         },
 
         /**
          * error 
          * @param {String} str
          */
         error : function(str){
             throw new Error(str);
         },
 
         /**
          * @return {Object} sae
          */
         noConflict : function(deep) {
             if ( window.sae === sae ) {
                 window.sae = _sae;
             }
             return sae;
         }
     });
 
 
     //================================ 模块加载 ================================
     /**
      * 模块加载方法
      * @param {String|Array}   ids      需要加载的模块
      * @param {Function} callback 加载完成之后的回调
      */
     win.require = sae.require = function(ids, callback){
         ids = typeof ids === 'string' ? [ids] : ids;
         var modules = sae.modules, urls = sae.urls, uuid = sae.guid('cb_'), data;
         data = parseModules(ids, basePath);
         modules[uuid] = {
             name : 'initialize',
             type : 2,
             state : 1,
             args : data.args,
             factory : callback
         };
         urls = urls.concat(data.urls);
         sae.load(urls);
     };
 
     /**
      * @param  {String} id           模块名
      * @param  {String|Array} [dependencies] 依赖列表
      * @param  {Function} factory      工厂方法
      */
     win.define = function(id, dependencies, factory){
         if(typeof dependencies === 'function'){
             factory = dependencies;
             if(typeof id === 'array'){
                 dependencies = id;
             }else if(typeof id === 'string'){
                 dependencies = [];
             }
         }else if (typeof id == 'function'){
             factory = id;
             dependencies = [];
         }
         id = sae.getCurrentScript();
 
         dependencies = typeof dependencies === 'string' ? [dependencies] : dependencies;
 
         var handle = function(id, dependencies, factory){
             var modules = sae.modules, urls = sae.urls;
             modules[id].factory = factory;
             modules[id].state = 2;
             if(!dependencies.length){
                 fireFactory(id);
             }else{
                 var data = parseModules(dependencies, id, true);
                 urls = urls.concat(data.urls);
                 sae.load(urls);
             }
         }
  	 //console.log('id--' + id);
         if(!id){
             sae.stacks.push(function(dependencies, factory){
                 return function(id){
                     handle(id, dependencies, factory);
                     id = null; dependencies = null; factory = null;
                 }
             }(dependencies, factory));
         }else{
             handle(id, dependencies, factory);
         }
     }
 
     require.amd = define.amd = sae.modules;
 
     /**
      * 解析加载模块信息
      * @param {Array} list
      * @param {String} path 
      * @param {boolean} flag 
      * @return {Object}
      */
     function parseModules(list, basePath, flag){
         var modules = sae.modules, urls = [], args = [], uniqurl = {}, id, result;
         while(id = list.shift()){
             if(modules[id]){ 
                 args.push(id);
                 continue;
             }
             result = parseModule(id, basePath);
             modules[basePath] && modules[basePath].args.push(result[1]);
             flag && checkCircularDeps(result[1], basePath) && sae.error('模块[url:'+ basePath +']与模块[url:'+ result[1] +']循环依赖');
             modules[result[1]] = {
                 type : result[2] === 'js' ? 1 : 2,
                 name : result[0],
                 state : 0,
                 exports : {},
                 args : [],
                 factory : sae.noop
             };
             (result[2] === 'js') && args.push(result[1]);
             if(!uniqurl[result[1]]){
                 uniqurl[result[1]] = true;
                 urls.push(result[1]);
             }
         }
 
         return {
             args : args,
             urls : urls
         }
     }
 
     /**
      * parse module
      * @param {String} id 模块名
      * @param {String} basePath 基础路径
      * @return {Array} 
      */
     function parseModule(id, basePath){
         var url, result, ret, dir, paths, i, len, type, modname, protocol = /^(\w+\d?:\/\/[\w\.-]+)(\/(.*))?/;
         if(result = protocol.exec(id)){
             url = id;
             paths = result[3] ? result[3].split('/') : [];
         }else{
             result = protocol.exec(basePath);
             url = result[1];
             paths = result[3] ? result[3].split('/') : [];
             modules = id.split('/');
             paths.pop();
             for(i = 0, len = modules.length; i < len; i++){
                 dir = modules[i];
                 if(dir == '..'){
                     paths.pop();
                 }else if(dir !== '.'){
                     paths.push(dir);
                 }
             }
             url = url + '/' + paths.join('/');
         }
         modname = paths[paths.length - 1];
         type = modname.slice(modname.lastIndexOf('.') + 1);
         if(type !== 'js' && type !== 'css'){
             type = 'js';
             url += '.js';
         }
         return [modname, url, type];
     }
 
     /**
      * fire factory
      * @param  {String} uuid
      */
     function fireFactory(uuid){
         var modules = sae.modules,
         data = modules[uuid], deps = data.args,
         i = 0, len = deps.length, args = [];
         for(; i < len; i++){
             args.push(modules[deps[i]].exports)
         }
         data.exports = data.factory.apply(null, args);
         data.state = 3;
         delete data.factory;
         delete data.args;
         if(data.type == 2 && data.name == 'initialize'){
             delete modules[uuid];
         }
         checkLoadReady();
     }
 
     /**
      * 检测是否全部加载完毕
      */
     function checkLoadReady(){
         var modules = sae.modules, flag = true, data, prop, deps, mod, i , len;
         for (prop in modules) {
             data = modules[prop];
             if(data.type == 1 && data.state != 2){    //如果还没执行到模块的define方法
                 continue;
             }
             deps = data.args;
             for(i = 0, len = deps.length; mod = deps[i], i < len ; i++){
                 if(hasOwn.call(modules, mod) && modules[mod].state != 3){
                     flag = false;
                     break;
                 }
             }
             if(data.state != 3 && flag){
                 fireFactory(prop);
             }
         }
     }
 
     /**
      * 检测循环依赖
      * @param  {String} id         
      * @param  {Array} dependencie
      */
     function checkCircularDeps(id, dependencie){
         var modules = sae.modules, depslist = modules[id] ? modules[id].args : [];
         return ~depslist.join(' ').indexOf(dependencie);
     }
 
     /**
      * create
      * @param {String} type CSS|JS
      * @param {String} url
      * @param {Function} callback
      */
     function loadSource(type, url, callback){
         var ndoe, modules = sae.modules;
         if(type == 'JS'){
             var node = doc.createElement("script");
             node[node.onreadystatechange ? 'onreadystatechange' : 'onload'] = function(){
                 if(!node.onreadystatechange || /loaded|complete/i.test(node.readyState)){
                     callback();
                     node.onload = node.onreadystatechange = node.onerror = null;
                     var fn = sae.stacks.pop();
                     fn && fn.call(null, node.src);
                     head.removeChild(node);
                 }
             }
             node.src = url;
             modules[url].state = 1;
             sae.loading++;
         }else if(type == 'CSS'){
             var node = doc.createElement("link");
             node.rel = 'stylesheet';
             node.href = url;
             delete modules[url];
         }
         node.onerror = function(){
             sae.error('模块[url:'+ node.src +']加载失败');
             node.onload = node.onreadystatechange = node.onerror = null;
             sae.loading--;
             head.removeChild(node);
         }
         return node;
 
     };
 
     sae.mix(sae, {
         load : function(urls){
             var loading , total = configure.total,modules = sae.modules, url, node = fragment, type;
             while((loading = sae.loading) < total && (url = urls.shift())){
                 type = url.slice(url.lastIndexOf('.') + 1).toUpperCase();
                 node.appendChild(loadSource(type, url, function(){
                     sae.loading--;
                     var urls = sae.urls;
                     urls.length && sae.load(urls); 
                 }));
             }
             head.insertBefore(node, head.firstChild);
         },
 
         /**
          * 加载JS文件
          * @param {String} url
          * @param {Function} callback 
          */
         loadJS : function(url, callback){
             var node = loadSource('JS', url, callback)
             head.insertBefore(node, head.firstChild);
         },
 
         /**
          * 加载CSS文件
          * @param {String} url
          * @param {Function} callback
          */
         loadCSS : function(url, callback){
             var node = loadSource('CSS', url, callback);
             head.insertBefore(node, head.firstChild);
         },
 
         /**
          * get current script [此方法来自司徒正美的博客]
          * @return {String}
          */
         getCurrentScript : function(){
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
                 if (node.readyState === "interactive") {
                     return node.src;
                 }
             }    
         },
 
         /**
          * 配置模块信息
          * @param  {Object} option
          */
         config : function(option){
             sae.mix(configure, option);
         },
 
 
     //============================== DOM Ready =============================
         
         /**
          * dom ready
          * @param {Function} callback
          */
         ready : function (){                              
             var isReady = false;
             var readyList = [];
             var ready = function(fn){
                 if(isReady){
                     fn();
                 }else{
                     readyList.push(fn);
                 }
             };
 
             var fireReady = function(){
                 for(var i = 0,len = readyList.length; i < len; i++){
                     readyList[i]();
                 }
                 readyList = [];
                 sae.modules.ready.state = 3;
                 checkLoadReady();
             };
 
             var bindReady = function(){
                 if(isReady){
                     return;
                 }
                 isReady=true;
                 fireReady();
                 if(doc.removeEventListener){
                     doc.removeEventListener("DOMContentLoaded",bindReady,false);
                 }else if(doc.attachEvent){
                     doc.detachEvent("onreadystatechange", bindReady);
                 }               
             };
 
             if( doc.readyState === "complete" ) {
                 bindReady();
             }else if(doc.addEventListener){
                 doc.addEventListener("DOMContentLoaded", bindReady, false);
             }else if(doc.attachEvent){
                 doc.attachEvent("onreadystatechange", function(){
                     if((/loaded|complete/).test(doc.readyState)){
                         bindReady();
                     }                       
                 });
                 (function(){
                     if(isReady){
                         return;
                     }
                     var node = new Image();
                     var timer = setInterval(function(){
                         try{
                             isReady || node.doScroll('left');
                             node = null;
                         }catch(e){
                             return;
                         }
                         clearInterval(timer);
                         bindReady();
                     }, 16);
                 }());
             }
             return ready;
         }()
     });
     
     win.sae = sae;
 }(window));
