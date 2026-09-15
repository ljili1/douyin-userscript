# 抖音优化（定制分支）

基于 [WhiteSevs/TamperMonkeyScript](https://github.com/WhiteSevs/TamperMonkeyScript) 的「抖音优化」用户脚本
（ScriptCat 脚本页 [id=2534](https://scriptcat.org/zh-CN/script-show-page/2534)）的定制分支，
在官方 **2026.9.14** 的基础上合并了个人定制的功能。

## 定制功能（相对官方版）

| 功能 | 说明 |
|---|---|
| 隐藏左侧导航栏（悬停显示） | 左侧导航栏默认隐藏，鼠标移入左侧边缘自动滑出、移出自动收起；导航改为 `fixed` 悬浮层，脱离 flex 布局不再占位 |
| 隐藏顶部导航栏（悬停显示） | 顶部导航栏默认隐藏，鼠标移入顶部区域自动显示；并修复隐藏后「消息」面板顶部留白问题 |
| `removeStyleBottom` 增强 | 以 MutationObserver + 穿透 Shadow DOM 的方式，确保后加载的视频容器同样生效 |

> 上述功能需在脚本的【设置】面板中手动开启。

## 安装

1. 先安装任意用户脚本管理器：[ScriptCat](https://scriptcat.org/) / [Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/)。
2. 点击下方链接安装：

   ```
   https://raw.githubusercontent.com/ljili1/douyin-userscript/main/douyin-optimize.user.js
   ```

## 版本

- 当前基于官方 `2026.9.14`（2026-09-15 合并）
- 本定制版脚本未设置 `@updateURL` / `@downloadURL`，安装后不会被上游自动覆盖。

## 许可与致谢

- 本分支派生自 WhiteSevs 的「抖音优化」，遵循 **GPL-3.0-only** 许可，详见 [LICENSE](./LICENSE)。
- 原项目：<https://github.com/WhiteSevs/TamperMonkeyScript>
