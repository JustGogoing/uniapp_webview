/**
 * sdx-uni-webview H5 桥接脚本 v1.2.0
 * 配合 sdx-uni-webview 组件实现 H5 与宿主（App/鸿蒙）双向实时通讯
 *
 * 前置依赖：必须先引入 uni.webview.1.5.8.js（App/鸿蒙通用，无需 jweixin）
 *   建议下载到自己的服务器后引入：
 *   <script type="text/javascript" src="您的域名/uni.webview.1.5.8.js"></script>
 *   <script type="text/javascript" src="您的域名/bridge.js"></script>
 *   两个 script 均建议放在 body 底部
 *
 * 使用方式：
 *   // H5 -> 宿主发送消息（宿主端通过组件 @message 事件接收）
 *   window.$sdxBridge.postToHost({ action: 'submit', payload: {...} });
 *
 *   // 监听宿主下发的消息（宿主端调用组件 sendToH5 方法后触发）
 *   window.$sdxBridge.onHostMessage(function (payload) {
 *     console.log('收到宿主消息:', payload);
 *   });
 *
 * 兼容性：
 *   - App（Android/iOS）：uni.webview.1.5.8.js
 *   - 鸿蒙（APP-HARMONY，HBuilderX 4.23+）：uni.webview.1.5.7 及以上（getEnv 返回 harmony）
 *   - 微信小程序：不支持（宿主->H5 无官方直连通道）
 */
(function (global) {
	'use strict';

	var queued = [];      // UniAppJSBridgeReady 之前积压的待发消息
	var ready = false;    // uni.webView 是否可用
	var callbacks = [];   // 宿主消息回调列表

	function flushQueue() {
		while (queued.length) {
			post(queued.shift());
		}
	}

	function post(data) {
		try {
			// 消息必须包裹在 data 字段中，宿主端 event.detail.data 为数组
			uni.webView.postMessage({ data: data });
		} catch (e) {
			console.warn('[sdxBridge] postMessage 失败:', e);
		}
	}

	function init() {
		if (ready) return;
		ready = true;
		flushQueue();
	}

	// uni.webview.js 加载完成且环境就绪后触发
	if (typeof uni !== 'undefined' && uni.webView) {
		init();
	} else {
		document.addEventListener('UniAppJSBridgeReady', init);
	}

	var bridge = {
		version: '1.2.0',

		/**
		 * H5 -> 宿主 发送消息
		 * @param {*} data 任意可序列化数据（对象/字符串/数字等）
		 */
		postToHost: function (data) {
			if (!ready) {
				// SDK 未就绪时先入队，UniAppJSBridgeReady 后自动发出
				queued.push(data);
				return;
			}
			post(data);
		},

		/**
		 * 注册宿主消息监听（可多次调用，按注册顺序依次回调）
		 * @param {Function} cb 接收宿主 sendToH5 下发的 payload
		 */
		onHostMessage: function (cb) {
			if (typeof cb === 'function') {
				callbacks.push(cb);
			}
		},

		/**
		 * 获取当前运行环境
		 * @param {Function} cb 回调入参 { plus, harmony, ... }（App 端 plus=true，鸿蒙端 harmony=true）
		 */
		getEnv: function (cb) {
			if (typeof uni !== 'undefined' && uni.webView && typeof uni.webView.getEnv === 'function') {
				uni.webView.getEnv(cb);
			}
		},

		/**
		 * 供宿主端 evalJS 调用的内部入口，接入方无需直接使用
		 * @param {*} payload 宿主下发的数据（已反序列化）
		 */
		_onHostMessage: function (payload) {
			for (var i = 0; i < callbacks.length; i++) {
				try {
					callbacks[i](payload);
				} catch (e) {
					console.warn('[sdxBridge] onHostMessage 回调异常:', e);
				}
			}
		}
	};

	global.$sdxBridge = bridge;
})(window);
