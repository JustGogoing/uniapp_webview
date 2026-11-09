## 1.2.0（2026-11-09）
1. 新增宿主 ↔ H5 双向实时通讯（点对点直连，不经过服务器）：
   - H5 → 宿主：H5 引入 `uni.webview.1.5.8.js` + `bridge.js` 后调用 `window.$sdxBridge.postToHost`，组件 `@message` 事件实时接收（已统一拆为单条消息）
   - 宿主 → H5：组件暴露 `sendToH5(payload)` 方法，App 端 evalJS、鸿蒙端 `uni.createWebviewContext().evalJS` 实时下发
   - H5 桥接脚本与接入说明见 `static/h5-bridge/`
2. 组件新增 props：`src`（H5 地址）、`webviewId`（鸿蒙必需）、`enhance`（增强功能开关）
3. 新增鸿蒙（APP-HARMONY）支持，需 HBuilderX 4.23+、H5 侧 uni.webview.js 1.5.7+
4. 微信小程序不支持双向通讯（官方无"小程序→H5"直连通道），文档中已注明
5. 演示页改造：加载本地 `hybrid/html/test-h5.html` 演示双向收发（ready 上报 / hostHello 下发 / ping-pong 应答）
6. 保留原有增强功能：安卓视频全屏横屏、长按保存图片（含 base64）、返回优化

## 1.1.0（2025-03-21）
1. 修改为组件集成模式
