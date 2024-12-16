mui.init({
	gestureConfig: {
		longtap: true
	},
	//侧滑关闭  
	swipeBack: true, //Boolean(默认false)启用右滑关闭功能    
 
	//监听Android手机的back、menu按键  
	keyEventBind: {
		backbutton: false, //Boolean(默认true)关闭back按键监听  
		menubutton: false //Boolean(默认true)关闭menu按键监听  
	}
});

document.addEventListener('longtap', function(e) {
	if (e.target.tagName == "IMG") {
		mui.confirm('是否保存图片', '确认保存', '保存', function(d) {
			if (d.index == 0) {
				if(e.target.src.startsWith('data:image')) {
					const bitmap = new plus.nativeObj.Bitmap()
					// 从本地加载Bitmap图片
					bitmap.loadBase64Data(e.target.src, function() {
						const date = new Date().getTime()
						bitmap.save("_doc/" + date + ".jpg", {
							overwrite: true,
							quality: 10
						}, function(i) {
							plus.gallery.save(i.target, function() {
								mui.toast('保存成功,请查看相册')
							}, function(e) {
								if (e.code === -3310 || e.code === 8) {
									mui.toast('您已禁止访问相册,请设置开启权限')
								} else {
									mui.toast("图片保存失败:" + JSON.stringify(e))
								}
							})
						}, function(e) {
							mui.toast("保存图片失败：" + JSON.stringify(e))
						})
					}, function(e) {
						mui.toast("加载图片失败：" + JSON.stringify(e))
					})
				} else {
					var down = plus.downloader.createDownload(e.target.src, {}, function(e, a) {
						plus.gallery.save(e.filename, function(e) {
							mui.toast('保存成功,请查看相册')
						}, function(e) {
							mui.toast('保存失败')
						})
					})
					down.start()
				}
			}
		})
	}
})