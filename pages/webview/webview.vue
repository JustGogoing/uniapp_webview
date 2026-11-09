<template>
	<view>
		<sdx-uni-webview ref="webviewRef" :src="url" webviewId="sdxUniWebview" @message="onMessage" />
	</view>
</template>

<script setup>
/**
 * sdx-uni-webview 双向通讯演示页（App/鸿蒙）
 *
 * 演示内容：
 * 1. H5 -> 宿主：测试页 test-h5.html 加载后自动上报 ready；点击"发送 postToHost"按钮可自定义消息，
 *    宿主端通过组件 @message 事件实时接收（toast + console 输出）
 * 2. 宿主 -> H5：页面加载 3 秒后自动调用 sendToH5 下发一条消息；收到 H5 的 ping 消息后自动回发 pong，
 *    H5 侧日志区实时显示
 *
 * 说明：web-view 在 App 端层级最高，会覆盖页面内所有组件，
 * 因此宿主端的交互反馈统一使用 uni.showToast / console 输出
 */
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app"

const webviewRef = ref(null);
const url = ref('/hybrid/html/test-h5.html');

/**
 * 接收 H5 消息（组件已将 event.detail.data 数组拆为单条透出）
 */
const onMessage = (msg) => {
	console.log('[demo] 收到H5消息:', JSON.stringify(msg));
	uni.showToast({
		title: '收到H5消息: ' + shortText(msg),
		icon: 'none',
		duration: 2500
	});

	// ping-pong 演示：H5 发 ping，宿主回 pong
	if (msg && msg.action === 'ping') {
		sendToH5({
			action: 'pong',
			echo: msg.payload || null,
			time: Date.now()
		});
	}
};

/**
 * 宿主 -> H5 发送消息
 */
const sendToH5 = (payload) => {
	const ok = webviewRef.value && webviewRef.value.sendToH5(payload);
	console.log('[demo] sendToH5(' + JSON.stringify(payload) + ') =>', ok);
	if (!ok) {
		uni.showToast({ title: '发送失败：webview 未就绪', icon: 'none' });
	}
	return ok;
};

const shortText = (msg) => {
	const text = typeof msg === 'string' ? msg : JSON.stringify(msg);
	return text.length > 20 ? text.slice(0, 20) + '…' : text;
};

onLoad(() => {
	// 延时下发，等待 H5 页面加载完成并注册 onHostMessage 回调
	setTimeout(() => {
		sendToH5({
			action: 'hostHello',
			payload: { from: 'uni-app 宿主', msg: '宿主加载后自动下发的测试消息' }
		});
	}, 3000);
});
</script>
