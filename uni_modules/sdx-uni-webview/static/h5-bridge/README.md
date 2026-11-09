# H5 侧接入说明（uni.webview.1.5.8.js + bridge.js）

本目录提供 H5 页面接入 sdx-uni-webview 双向通讯所需的桥接脚本与接入说明。

**适用平台：App（Android/iOS）、鸿蒙（APP-HARMONY）。微信小程序不支持**（官方不提供"小程序→H5"的直连通道，仅 bindmessage 非实时回传，详见插件 readme 的平台差异表）。

## 一、准备 SDK 文件

将以下两个文件下载后放到 **H5 项目自己的服务器**上（不要直接外链）：

| 文件 | 下载地址 | 说明 |
|---|---|---|
| uni.webview.1.5.8.js | https://gitcode.com/dcloud/uni-app/tree/uni-app-vue2-dev/dist/uni.webview.1.5.8.js | DCloud 官方 web-view 通讯 SDK，App/鸿蒙通用 |
| bridge.js | 本目录 `bridge.js` | sdx-uni-webview 桥接脚本，对 H5 开发者屏蔽平台差异 |

> 鸿蒙端要求 uni.webview.js **1.5.7 及以上**版本（`getEnv` 才能正确返回 `harmony`），推荐直接使用 1.5.8。

## 二、H5 页面引入

两个 `<script>` 均建议放在 **body 底部**，且 bridge.js 必须在 uni.webview.js 之后：

```html
<body>
  <!-- 页面内容 -->
  <script type="text/javascript" src="您的域名/uni.webview.1.5.8.js"></script>
  <script type="text/javascript" src="您的域名/bridge.js"></script>
</body>
```

## 三、API 使用

### 1. H5 → 宿主（发送消息）

```js
// 无需自己监听 UniAppJSBridgeReady，bridge 内部已处理（就绪前自动入队，就绪后自动发出）
window.$sdxBridge.postToHost({
  action: 'submit',
  payload: { title: 'xxx', count: 1 }
});
```

宿主端（uni-app 工程）通过组件的 `@message` 事件接收，**App/鸿蒙端均为实时接收**。

### 2. 宿主 → H5（接收消息）

```js
// 可多次调用注册多个监听，按注册顺序依次回调
window.$sdxBridge.onHostMessage(function (payload) {
  console.log('收到宿主消息:', payload);
});
```

宿主端调用组件的 `sendToH5(payload)` 方法后，消息会实时下发到此处。

### 3. 获取当前环境（可选）

```js
window.$sdxBridge.getEnv(function (res) {
  // App 端：res.plus === true
  // 鸿蒙端：res.harmony === true
});
```

## 四、最小接入示例

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>H5 Demo</title>
</head>
<body>
  <button onclick="sendToHost()">发消息给宿主</button>
  <div id="log"></div>

  <script type="text/javascript" src="您的域名/uni.webview.1.5.8.js"></script>
  <script type="text/javascript" src="您的域名/bridge.js"></script>
  <script>
    // 监听宿主下发
    window.$sdxBridge.onHostMessage(function (payload) {
      document.getElementById('log').innerText = JSON.stringify(payload);
    });

    // 向宿主发送
    function sendToHost() {
      window.$sdxBridge.postToHost({ action: 'hello', time: Date.now() });
    }
  </script>
</body>
</html>
```

## 五、注意事项

1. **消息序列化**：`postToHost` 传对象即可，无需手动 JSON.stringify；宿主端 `sendToH5` 下发的 payload 同样已是对象。
2. **宿主端接收格式**：`@message` 事件的 `event.detail.data` 为**数组**（多次 postMessage 的消息按顺序排列），组件已统一消化该差异，调用方拿到的即为单条消息内容。
3. **不要手动调用** `window.$sdxBridge._onHostMessage`，它是宿主 evalJS 的内部入口。
4. **uni-app 编译的 H5** 同样适用本接入方式；H5 页面内部的页面跳转如需走宿主路由，可直接调用 `uni.webView.navigateTo(...)` 等 API（需在 UniAppJSBridgeReady 后）。
5. bridge.js 未就绪时调用 `postToHost` 不会丢消息（内部自动排队），但**页面加载即调用**的场景仍建议等 DOM 就绪后再发。
6. 本方案为点对点直连，**不经过任何服务器中转**，无域名白名单要求。
