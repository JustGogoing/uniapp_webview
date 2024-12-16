# WebView功能增强-仅针对APP（Android、iOS）

> 在日常项目开发APP时，经常使用到WebView，官方提供的WebView可以满足基础使用，但是有些特殊需求则需要我们调用5+语法或者通过其他方式进行处理。
> 这里，我针对我日常项目中遇到的问题，查阅官方论坛、参考其他插件寻求了一些解决之道，在这里提供给大家做个参考。


**功能点**
1. 视频全屏（横屏-仅安卓）。在WebView中播放视频，点击全屏通常是视频可以全屏但是不能够横屏，由于iOS是脱离应用由系统播放器接管，所以暂时没有深入寻找解决方案；这里仅提供对安卓的解决方案。
2. 保存图片。在WebView中有时我们需要保存图片到相册，这里我们进行了处理，不仅支持传统图片文件，也支持base64图片。（注：这里保存是识别的html中的img标签，所以全局的图片都是可以长按保存到，如果需要限制某些图片可以保存，需要自己处理WebView—script.js文件中的逻辑）
3. 返回优化。 在WebView打开H5页面时，有时打开了很多层级页面栈，但是使用手势返回却直接关闭了WebView（不同手机表现不同，尤其iOS），这里我对这种情况进行了优化处理，手势返回，优先调用h5的返回，当页面栈为空时关闭WebView。


- 由于个人能力和精力有限，所以项目中可能存在一些问题和不足，还望各位多多包涵指正，大家一起学习。
