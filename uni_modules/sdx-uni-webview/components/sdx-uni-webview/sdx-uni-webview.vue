<template>
	<web-view :id="webviewId" :src="src" @message="onMessage"></web-view>
</template>

<script setup>
/**
 * sdx-uni-webview WebView增强组件 v1.2.0
 *
 * 双向通讯（App/鸿蒙实时直连，不经过服务器）：
 * - H5 -> 宿主：H5 引入 uni.webview.1.5.8.js + bridge.js 后调用 window.$sdxBridge.postToHost(data)，
 *   本组件通过 @message 实时接收并统一 emit 'message' 事件（单条消息）
 * - 宿主 -> H5：调用本组件暴露的 sendToH5(payload) 方法，通过 evalJS 实时调起
 *   H5 侧 window.$sdxBridge._onHostMessage 回调
 * - H5 侧接入步骤见 static/h5-bridge/README.md
 * - 微信小程序不支持双向通讯（官方无"小程序->H5"直连通道），本组件仅保证 App/鸿蒙
 *
 * APP 增强能力（props.enhance 控制，默认开启）：
 * - 安卓视频全屏横屏、硬件加速、缓存优先
 * - 长按保存图片（含 base64）到相册（依赖 static/webview_script.js）
 * - 导航栏按钮关闭 webview 并返回
 */
import { onNavigationBarButtonTap, onLoad } from "@dcloudio/uni-app"
import { getCurrentInstance } from "vue";

const props = defineProps({
	// web-view 加载的 H5 地址
	src: {
		type: String,
		default: ''
	},
	// web-view 组件 id，鸿蒙端 uni.createWebviewContext 必需
	webviewId: {
		type: String,
		default: 'sdxUniWebview'
	},
	// 是否启用 APP 增强功能（保存图片/返回处理/视频全屏），仅通讯需求时可关闭
	enhance: {
		type: Boolean,
		default: true
	}
});

const emit = defineEmits(['message']);
const instance = getCurrentInstance();

// ---------------- H5 -> 宿主 ----------------
/**
 * @message 事件接收：event.detail.data 为数组（多次 postMessage 按序排列），
 * 此处逐条透出，对调用方统一为单条消息
 */
const onMessage = (event) => {
	const data = event && event.detail && event.detail.data;
	if (!Array.isArray(data)) return;
	data.forEach(item => emit('message', item));
};

// ---------------- 宿主 -> H5 ----------------
/**
 * 序列化 payload 并转义 U+2028/U+2029，
 * 避免 evalJS 注入时被 JS 引擎当作行终止符导致语法错误
 */
const serialize = (payload) => {
	return JSON.stringify(payload)
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
};

// #ifdef APP-PLUS
/**
 * App 端获取 web-view 对应的子 webview（plus 语法）
 * sendToH5 可能先于组件内部延时初始化被调用，故每次实时获取
 */
const getChildWebview = () => {
	try {
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		if (!page || !page.$getAppWebview) return null;
		return page.$getAppWebview().children()[0] || null;
	} catch (e) {
		console.warn('[sdx-uni-webview] 获取子 webview 失败:', e);
		return null;
	}
};
// #endif

/**
 * 宿主 -> H5 发送消息（实时）
 * @param {*} payload 任意可序列化数据，H5 侧 onHostMessage 注册的回调接收
 * @returns {Boolean} 是否发送成功
 */
const sendToH5 = (payload) => {
	const js = `(window.$sdxBridge && window.$sdxBridge._onHostMessage(${serialize(payload)}))`;

	// #ifdef APP-PLUS
	const wv = getChildWebview();
	if (wv && typeof wv.evalJS === 'function') {
		wv.evalJS(js);
		return true;
	}
	console.warn('[sdx-uni-webview] 子 webview 未就绪，sendToH5 发送失败');
	return false;
	// #endif

	// #ifdef APP-HARMONY
	// 鸿蒙不支持 plus，必须使用 createWebviewContext
	try {
		const ctx = uni.createWebviewContext(props.webviewId, instance && instance.proxy);
		if (ctx && typeof ctx.evalJS === 'function') {
			ctx.evalJS(js);
			return true;
		}
	} catch (e) {
		console.warn('[sdx-uni-webview] createWebviewContext 失败:', e);
	}
	console.warn('[sdx-uni-webview] webviewContext 未就绪，sendToH5 发送失败');
	return false;
	// #endif

	// #ifndef APP-PLUS || APP-HARMONY
	console.warn('[sdx-uni-webview] 当前平台不支持 sendToH5 直连通讯（仅支持 App/鸿蒙）');
	return false;
	// #endif
};

// ---------------- APP 增强 ----------------
// #ifdef APP-PLUS
const initEnhance = () => {
	const pages = getCurrentPages();
	const page = pages[pages.length - 1];
	const currentWebview = page.$getAppWebview();
	currentWebview.setStyle({
		popGesture: 'none'
	})
	setTimeout(() => {
		const wv = getChildWebview();
		if (!wv) return;
		wv.setStyle({
			hardwareAccelerated: true, // 开启硬件加速
			cachemode: 'cacheElseNetwork', // 优先加载缓存
			videoFullscreen: 'landscape' // 视频全屏横屏（安卓）
		})
		wv.appendJsFile('_www/static/resetMUI.js')
		wv.appendJsFile('_www/static/mui.min.js')
		setTimeout(function() {
			// 长按保存图片逻辑（含 base64 图片）
			wv.appendJsFile('_www/static/webview_script.js')
		}, 1000)
	}, 1000)
};

// 注意：onLoad 在 setup 阶段会同步触发，必须放在 initEnhance 定义之后
onLoad(() => {
	if (props.enhance) {
		initEnhance();
	}
});

onNavigationBarButtonTap(() => {
	// #ifdef APP
	const currentWebview = getChildWebview();
	if (uni.getSystemInfoSync().osName == 'android') {
		currentWebview && currentWebview.close();
	} else if (uni.getSystemInfoSync().osName == 'ios') {
		const pages = getCurrentPages();
		const page = pages[pages.length - 1];
		page.$getAppWebview().close();
	}
	setTimeout(() => {
		const pages = getCurrentPages();
		if (pages.length > 1) {
			uni.navigateBack({ delta: 1 })
		} else {
			uni.redirectTo({ url: "/pages/index/index" })
		}
	}, 200);
	// #endif
});
// #endif

defineExpose({
	sendToH5
});
</script>
