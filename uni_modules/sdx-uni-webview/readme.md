# sdx-uni-webview

WebView 增强 + 双向通讯组件，支持 **App（Android/iOS）** 与 **鸿蒙（APP-HARMONY，HBuilderX 4.23+）**。

> 在日常项目开发 APP 时，经常使用到 WebView，官方提供的 WebView 可以满足基础使用，但有些特殊需求则需要我们调用 5+ 语法或者通过其他方式进行处理。这里提供了一些解决之道，供大家参考。

## 功能一览

1. **宿主 ↔ H5 双向实时通讯**（v1.2.0 新增）：直连通讯，不经过服务器中转，App/鸿蒙端均实时收发
2. **视频全屏横屏（仅安卓）**：WebView 内视频可全屏且强制横屏（iOS 由系统播放器接管，暂无方案）
3. **长按保存图片到相册**：支持普通图片与 base64 图片（识别 html 中 img 标签）
4. **返回优化**：手势/导航栏返回优先调用 H5 内部返回，页面栈为空时才关闭 WebView

## 平台兼容性

| 平台 | 双向通讯 | 增强功能 | 说明 |
|---|---|---|---|
| Android（App） | ✅ 实时双向 | ✅ | plus 语法 + evalJS |
| iOS（App） | ✅ 实时双向 | ✅（视频横屏除外） | plus 语法 + evalJS |
| 鸿蒙（APP-HARMONY） | ✅ 实时双向 | ⚠️ 部分 | 不支持 plus，通讯走 `uni.createWebviewContext`，需 HBuilderX 4.23+ |
| 微信小程序 | ❌ | ❌ | **不支持**：官方不提供"小程序→H5"的直连通道（仅 bindmessage 非实时回传与 src 带参重载，均不满足实时双向直连要求），且本组件定位为点对点直连、不经服务器 |
| H5 | ❌ | ❌ | H5 端 web-view 即 iframe，无此需求 |

## 宿主端接入（uni-app 工程）

### 1. 使用组件

```vue
<template>
	<sdx-uni-webview
		ref="webviewRef"
		src="https://your-domain.com/h5-page"
		webviewId="sdxUniWebview"
		@message="onMessage"
	/>
</template>

<script setup>
import { ref } from 'vue';

const webviewRef = ref(null);

// 接收 H5 消息（已拆为单条，无需处理 event.detail.data 数组结构）
const onMessage = (msg) => {
	console.log('收到H5消息:', msg);
};

// 宿主 -> H5 发送消息（App/鸿蒙实时）
const send = () => {
	webviewRef.value.sendToH5({ action: 'update', payload: { count: 1 } });
};
</script>
```

### 2. Props / Events / Methods

| 类型 | 名称 | 说明 |
|---|---|---|
| prop | `src` | web-view 加载的 H5 地址 |
| prop | `webviewId` | web-view 组件 id，鸿蒙端 `uni.createWebviewContext` 必需，默认 `sdxUniWebview` |
| prop | `enhance` | 是否启用 APP 增强（保存图片/返回处理/视频全屏），默认 `true` |
| event | `@message` | H5 → 宿主消息，参数为单条消息内容（已消化各平台数组差异） |
| method | `sendToH5(payload)` | 宿主 → H5 发送消息，返回 `Boolean` 表示是否发送成功 |

### 3. 注意事项

- `sendToH5` 通过 evalJS 调用 H5 侧 `window.$sdxBridge._onHostMessage`，**H5 页面必须先完成 H5 侧接入**（见下文），否则消息被静默丢弃
- web-view 在 App 端层级最高，会覆盖页面内所有组件，宿主端交互反馈请使用 `uni.showToast`、`uni.showActionSheet` 等原生 API
- `enhance` 关闭后仅保留通讯能力，不再注入 mui/保存图片相关脚本

## H5 侧接入（被加载的网页）

完整步骤与最小示例见 [`static/h5-bridge/README.md`](./static/h5-bridge/README.md)，核心两步：

1. 下载 `uni.webview.1.5.8.js` 与 [`static/h5-bridge/bridge.js`](./static/h5-bridge/bridge.js) 放到 H5 自己的服务器，在 **body 底部**按顺序引入：

```html
<script type="text/javascript" src="您的域名/uni.webview.1.5.8.js"></script>
<script type="text/javascript" src="您的域名/bridge.js"></script>
```

2. 调用桥接 API：

```js
// H5 -> 宿主（就绪前自动入队，不丢消息）
window.$sdxBridge.postToHost({ action: 'submit', payload: {...} });

// 监听宿主下发
window.$sdxBridge.onHostMessage(function (payload) {
	console.log('收到宿主消息:', payload);
});
```

## 通讯原理与差异表

| 方向 | App（Android/iOS） | 鸿蒙 | 实时性 |
|---|---|---|---|
| H5 → 宿主 | `uni.webView.postMessage` → 组件 `@message` | 同左 | ✅ 实时 |
| 宿主 → H5 | 子 webview `evalJS` 注入 | `uni.createWebviewContext().evalJS`（无 plus） | ✅ 实时 |

- 通讯为**点对点直连**，不经过任何服务器，无域名白名单要求
- 鸿蒙端要求 uni.webview.js **1.5.7+**（`getEnv` 才返回 `harmony`）
- `UniAppJSBridgeReady` 就绪前调用 `postToHost` 会自动排队，就绪后发出

## Demo

`pages/webview/webview.vue` 为演示页，加载本地测试页 `hybrid/html/test-h5.html`：

- H5 页面加载后自动上报 `ready`（H5 → 宿主）
- 宿主 3 秒后自动下发 `hostHello`（宿主 → H5）
- H5 点击"发送"可自定义消息；发送 `ping` 宿主自动回发 `pong`
- 消息收发均有日志展示（H5 端页面内、宿主端 console + toast）

运行方式：HBuilderX 打开本项目，运行到安卓基座/iOS（iOS 需配置打包证书），鸿蒙需 HBuilderX 4.23+。

## 其他

- 由于个人能力和精力有限，项目中可能存在问题和不足，还望各位多多包涵指正，大家一起学习。
