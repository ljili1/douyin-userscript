# 抖音优化（定制分支）

基于 [WhiteSevs/TamperMonkeyScript](https://github.com/WhiteSevs/TamperMonkeyScript) 的「抖音优化」用户脚本
（ScriptCat 脚本页 [id=2534](https://scriptcat.org/zh-CN/script-show-page/2534)）的定制分支，
在官方 **2026.9.17.17** 的基础上合并了个人定制的功能。

## 定制功能（相对官方版）

| 功能 | 说明 |
|---|---|
| 隐藏左侧导航栏（悬停显示） | 左侧导航栏默认隐藏，**鼠标顶到屏幕最左边缘**（`clientX ≤ 1px` 临界值）时自动滑出、移出导航区域自动收起；导航改为 `fixed` 悬浮层，脱离 flex 布局不再占位 |
| 隐藏顶部导航栏（悬停显示） | 顶部导航栏默认隐藏，**鼠标顶到屏幕最上边缘**（`clientY ≤ 1px` 临界值）时自动显示；并修复隐藏后「消息」面板顶部留白问题 |
| `removeStyleBottom` 增强 | 以 MutationObserver + 穿透 Shadow DOM 的方式，确保后加载的视频容器同样生效 |

> 上述功能需在脚本的【设置】面板中手动开启。

## 安装

1. 先安装任意用户脚本管理器：[ScriptCat](https://scriptcat.org/) / [Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/)。
2. 点击下方链接安装（任选其一）：

   - 国内加速镜像（jsDelivr，推荐）：

     ```
     https://cdn.jsdelivr.net/gh/ljili1/douyin-userscript@main/douyin-optimize.user.js
     ```

   - GitHub 直连（raw）：

     ```
     https://raw.githubusercontent.com/ljili1/douyin-userscript/main/douyin-optimize.user.js
     ```

## 版本

- 当前基于官方 `2026.9.17.17`（2026-09-18 合并）
- 已合入的上游增量（9.14 → 9.17）：设置面板 `.pops` 最大高度 `90dvh` 限制、快捷键忽略逻辑重构（支持 `$target` 传入与 `contenteditable` 判断、修复空格键误触）、下载按钮快捷键提示
- 定制调整（2026-09-19）：左/顶部导航悬停触发由「固定窄带」（30px → 12px → 8px）改为**屏幕边缘临界值触发**（`clientX/clientY ≤ 1px`），彻底消除内容区移动时的误触发；同时补充滞回保持判定与边缘事件免节流处理
- 本定制版脚本未设置 `@updateURL` / `@downloadURL`，安装后不会被上游自动覆盖。

## 许可与致谢

- 本分支派生自 WhiteSevs 的「抖音优化」，遵循 **GPL-3.0-only** 许可，详见 [LICENSE](./LICENSE)。
- 原项目：<https://github.com/WhiteSevs/TamperMonkeyScript>
