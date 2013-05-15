fayhot js 工具包
======
[@fayhot]:http://weibo.com/misaki07
fayhot.js 基于publisher(事件广播),model(数据逻辑),view(视图) 实现简单的mvc模型. (by [@fayhot])

######**依赖文件**:
+ tool.js   包含常用的helper处理函数,以及微模板引擎
+ jquery.js 依赖于jquery实现ajax操作、dom选择和浏览器兼容 (>=1.7.2).

######**模块组成**:
+ template 微模板引擎
+ model    数据逻辑处理
+ view     依赖于tempalte和jquery,绑定视图交互事件
+ publisher 事件派发.model和view都继承了publisher的事件属性
+ iterator  迭代器对象
+ collectin 集合对象
+ dictionary 字典对象

######**模块简介**:
1. 微模板引擎
   
   + 微模板引擎默认配置.
   
   暂时不提供自定义默认配置,要修改配置,只能自己改源码
   
   ```js
   left :'{%', //左分隔符
   right:'%}', //右分隔符
   ref  :'data', //访问引用. 微模板引擎没有使用with语法,数据绑定到ref指定的变量上.默认为data
   ```
   + 微模板引擎通过编译节点模板,并注入数据,动态生成html页面.

   ```js
   /**
    * compile 接受两个参数
    * @Param html 节点id或者html字符串.
    * @param data json数组,用于注入的数据
    * @return 没有data,则返回函数,否则直接返回字符串
    */
   template.compile(html,data);
   var fn = template.compile('domid_or_html'),
       html = fn(data),
       htmlV2 = template.compile('domid_or_html',data);
   ```
   html与htmlV2的结果是一样的.使用第一种方式可以避免生成重复的同等功能的匿名函数.
   下面是一个完整的示例
   ```html
   <script type="text/html" id="test">
   <!--注意是通过data访问的具体数据-->
    <div> template demo .</div>
    {% if(data.name == 'misaki'){ %}
    这只是一个测试样本.name 是 {%=data.name%}, age 是 {%=data.age%}
    {% } %}
   </script>
   ```
   ```js
    //comiple获取dom节点内容并注入数据生成html
    var domid = "test",
    data  = {name:'misaki',age:22},
    html = template.compile(domid,data);
    //ps:上面操作等同于,唯一的区别是fn可复用
    fn = template.compile(domid);
    html = fn(data);
   ```
   ```html
   <!--下面是动态生成的html内容-->
   <div>template demo. </div>
   这只是一个测试样本.name是misaki,age是22
   ```
   
   + 辅助函数列表
      1. print    主要用于调试. 在html中输出调试内容. print() 则输出到当前块的模板内容
      2. debug    主要用于调试. 在firebug中输出调试内容. debug() 则输出到当前块的模板内容. 功能和print类似
      3. log      主要用于调试. 在firebug中输出调试内容. log(o) 则输出o
      4. include  实现类似php smarty模板的include方法. 具体实例参见下面include实例

   ```html
   <script type="text/html" id="test">
   <!--注意是通过data访问的具体数据-->
    <div> template demo .</div>
    {% if(data.name == 'misaki'){ %}
    这只是一个测试样本.name 是 {%=data.name%}, age 是 {%=data.age%}
    {% } %}
   </script>
   
   <script type="text/html" id="inc">
    <div>include demo</div>
    这个是这里的title.{%=data.title%}
    {% include('test',data.inc);
   </script>
   ```
   ```js
    //动态编译dom节点inc时,会自动编译并追加dom节点test的内容
    var data = {title:'这个是这里的title',inc:{name:'misaki',age:22}}.
    inchtml = template.compile('inc',data);
   ```
   ```html
   <!--下面是动态生成的html内容-->
    <div>include demo</div>
    这个是这里的title.这个是这里的title
    <div>template demo. </div>
    这只是一个测试样本.name是misaki,age是22
   ```
