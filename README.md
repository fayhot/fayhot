fayhot js 工具包
======
[@fayhot]:http://weibo.com/fayhot
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
