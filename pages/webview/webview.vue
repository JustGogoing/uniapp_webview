<template>
	<view>
		<web-view :src="URL"></web-view>
	</view>
</template>

<script setup>
	var wv;
	import { onNavigationBarButtonTap, onLoad, onBackPress } from "@dcloudio/uni-app"
	import { ref } from "vue";
	const URL = ref('https://m.bilibili.com/')
	onLoad(() => {
		// #ifdef APP-PLUS
		init()
		// #endif
	})
	const init = () => {
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];  
		const currentWebview = page.$getAppWebview();
		currentWebview.setStyle({
			popGesture: 'none'
		})
		setTimeout(() => {
			wv = currentWebview.children()[0];
			wv.setStyle({
				hardwareAccelerated:true, //开启硬件加速
				cachemode:'cacheElseNetwork',//优先加载缓存       
				videoFullscreen:'landscape'
			})
			wv.appendJsFile('_www/static/resetMUI.js')
			wv.appendJsFile('_www/static/mui.min.js')
			setTimeout(function() {
				wv.appendJsFile('_www/static/webview_script.js')
			},1000)
		}, 1000)
	}
	onNavigationBarButtonTap(item => {
		// #ifdef APP
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];  
		const currentWebview = page.$getAppWebview();  
		if(uni.getSystemInfoSync().osName=='android') {
			currentWebview.children()[0].close();
		} else if(uni.getSystemInfoSync().osName=='ios') {
			currentWebview.close();
		}
		setTimeout(() => {
			const pages = getCurrentPages();
			if(pages.length>1) {
				uni.navigateBack({ delta:1 })
			} else {
				uni.redirectTo({ url:"/pages/index/index" })
			}
		}, 200);
		// #endif
	})
</script>

