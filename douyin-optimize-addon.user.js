// ==UserScript==
// @name         抖音优化补充包（自定义功能独立版）
// @namespace    https://github.com/ljili1/douyin-userscript
// @version      2026.9.28
// @description  从「抖音优化」定制分支抽出的全部自定义功能，可脱离主脚本单独安装：①左侧导航栏悬停显隐（贴屏幕左边缘滑出）；②顶部导航栏悬停显隐（贴屏幕上边缘显示）；③「消息」面板贴顶修复；④视频 bottom 偏移移除增强（兼容后加载视频与 Shadow DOM）。
// @author       ljili
// @license      GPL-3.0-only
// @match        https://www.douyin.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/ljili1/douyin-userscript@main/douyin-optimize-addon.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/ljili1/douyin-userscript@main/douyin-optimize-addon.user.js
// ==/UserScript==

/*
 * 抖音优化补充包（自定义功能独立版）
 * ---------------------------------------------------------------
 * 本脚本与「抖音优化」主脚本（WhiteSevs 官方版或定制分支版）解耦，
 * 单独安装即可获得定制分支中的全部自定义功能。
 *
 * 注意：若同时安装「抖音优化_含自定义功能」定制分支主脚本，
 * 请只在一处开启同名功能，避免重复注入（功能幂等，重复开启无副作用但浪费资源）。
 *
 * 功能开关：脚本管理器菜单中点击对应条目即可切换，即时生效（无需刷新页面）。
 */
(function () {
  "use strict";

  const TAG = "[抖音优化补充包]";
  const log = {
    info: (...args) => console.log(TAG, ...args),
    error: (...args) => console.error(TAG, ...args),
  };

  /* ---------------- 基础工具（自足实现，不依赖主脚本） ---------------- */

  const $ = (selector) => document.querySelector(selector);

  /** 注入 CSS，返回移除函数。document-start 时 head 可能不存在，兜底挂到 documentElement */
  const addStyle = (css) => {
    const el = document.createElement("style");
    el.textContent = css;
    (document.head || document.documentElement).appendChild(el);
    return () => el.remove();
  };

  /** 简单节流（leading + trailing），替代主脚本的 utils.LockFunction */
  const throttle = (fn, wait) => {
    let last = 0;
    let timer = 0;
    return (...args) => {
      const now = Date.now();
      const remain = wait - (now - last);
      if (remain <= 0) {
        last = now;
        fn(...args);
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = 0;
          last = Date.now();
          fn(...args);
        }, remain);
      }
    };
  };

  /* ---------------- 设置存取与菜单 ---------------- */

  const SETTINGS = {
    leftNavHover: {
      key: "dy-addon-leftNavHover",
      name: "左侧导航栏悬停显隐（贴屏幕左边缘滑出）",
      def: true,
    },
    topNavHover: {
      key: "dy-addon-topNavHover",
      name: "顶部导航栏悬停显隐 + 消息面板贴顶修复",
      def: true,
    },
    videoBottom: {
      key: "dy-addon-videoBottom",
      name: "视频 bottom 偏移移除（增强版）",
      def: true,
    },
  };

  const getVal = (k, d) => (typeof GM_getValue === "function" ? GM_getValue(k, d) : d);
  const setVal = (k, v) => {
    if (typeof GM_setValue === "function") GM_setValue(k, v);
  };

  /* ---------------- 功能一：左侧导航栏悬停显隐 ---------------- */

  const initLeftNavHover = () => {
    log.info("启用隐藏左侧导航栏（悬停显示）");
    const result = [];
    /* 触发条件：仅当鼠标「触达视口最左边缘」时才滑出。
       贴边时浏览器会把 clientX 钳制为 0（继续往左推仍保持 0），
       故以 0 作为临界值，即可区分「鼠标路过左侧」与「主动顶到屏幕边缘」，
       从根本上消除在内容/视频区左侧移动造成的误触发。
       EDGE_TRIGGER_PX 为容差，吸收高分屏/子像素取整产生的 1px 误差；设为 0 即严格只认贴边。 */
    const EDGE_TRIGGER_PX = 1;
    result.push(
      addStyle(`
        /* 左侧导航栏改成悬浮层，脱离 flex 布局：隐藏后不再占位，右侧内容区自动占满 */
        #douyin-navigation {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          bottom: 0 !important;
          width: 160px !important;
          height: 100% !important;
          /* 修复：z-index 必须低于抖音浮层(设置面板=999、semi-portal=1060)，否则会遮挡左下角按钮的悬浮菜单 */
          /* 同时要高于抖音顶栏(502)与内容区(auto)，故取 600 */
          z-index: 600 !important;
          transform: translateX(-100%) !important;
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
          will-change: transform !important;
        }
        #douyin-navigation.dy-leftnav-hover-visible {
          transform: translateX(0) !important;
        }
        /* 导航栏脱离布局流后，右侧内容区占满整宽 */
        #douyin-right-container {
          width: 100% !important;
          margin-left: 0 !important;
          flex: 1 1 auto !important;
        }
        /* 左侧导航栏隐去后，顶部导航栏(固定定位，原本从 x=160 起)放开为整宽，避免左侧背景空缺一截 */
        #douyin-header {
          left: 0 !important;
          right: 0 !important;
          width: auto !important;
        }
        /* 内容区扩展时保持视频比例，避免横向拉伸变形 */
        #douyin-right-container video {
          object-fit: contain !important;
        }
      `)
    );
    let lastTime = 0;
    const THROTTLE_MS = 50;
    const onMouseMove = (event) => {
      /* 边缘临界值判定必须放在节流之前：一是纯数值比较零成本，
         二是「甩到边缘」的关键事件若被节流丢弃，会导致触发彻底失效
         （鼠标顶住边缘后不再产生新的位移，没有第二次机会）。 */
      const atEdge = event.clientX <= EDGE_TRIGGER_PX;
      const now = Date.now();
      if (!atEdge) {
        if (now - lastTime < THROTTLE_MS) return;
        lastTime = now;
      }
      const $nav = $("#douyin-navigation");
      if (!$nav) return;
      const isVisible = $nav.classList.contains("dy-leftnav-hover-visible");
      /* 滞回（保持）判定：滑出动画耗时 0.3s，鼠标从边缘移向导航的途中导航尚未覆盖到光标位置，
         若此时只认 :hover 会误判为「已离开」而立刻收回，形成滑出后回弹的闪烁。
         故一旦滑出，只要光标仍在导航占位宽度内（0 ~ navWidth）就继续显示，超出即收起。 */
      const shouldShow =
        atEdge || (isVisible && event.clientX <= ($nav.offsetWidth || 160));
      if (shouldShow && !isVisible) {
        $nav.classList.add("dy-leftnav-hover-visible");
      } else if (!shouldShow && isVisible) {
        $nav.classList.remove("dy-leftnav-hover-visible");
      }
    };
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    result.push(() => {
      document.removeEventListener("mousemove", onMouseMove);
      $("#douyin-navigation")?.classList.remove("dy-leftnav-hover-visible");
    });
    return result;
  };

  /* ---------------- 功能二 + 三：顶部导航栏悬停显隐 & 消息面板贴顶修复 ---------------- */

  const initTopNavHover = () => {
    log.info("启用隐藏顶部导航栏（悬停显示）+ 消息面板贴顶修复");
    const result = [];
    /* 触发条件：仅当鼠标「触达视口最上边缘」（clientY 被钳制为 0）时才显示，
       与左侧导航的「屏幕边缘临界值」触发保持一致。
       EDGE_TRIGGER_PX 为 1px 容差，设为 0 即严格只认贴边。 */
    const EDGE_TRIGGER_PX = 1;
    result.push(
      addStyle(`
        #douyin-header {
          transform: translateY(-100%) !important;
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
          will-change: transform !important;
        }
        #douyin-header.dy-header-hover-visible {
          transform: translateY(0) !important;
        }
        /* 隐藏后让内容区向上扩展，占满顶部导航栏原位置 */
        #douyin-right-container {
          padding-top: 0px !important;
        }
        /* 内容区扩展时保持视频比例，避免横向拉伸变形 */
        #douyin-right-container video {
          object-fit: contain !important;
        }
        @media screen and (max-width: 550px) and (orientation: portrait) {
          .is-mobile-pc {
            --header-height: 0px !important;
          }
        }
      `)
    );
    let lastTime = 0;
    const THROTTLE_MS = 50;
    // —— 消除「消息」面板因顶部导航隐藏而留下的顶部空白 ——
    // 抖音面板类名为构建时哈希、且为原生组件，无法写死选择器。
    // 据真实 DOM：消息面板根 = #im-entry-vmok-popup-portal（或 [data-e2e="im-dialog"]）
    // 的最近 fixed 祖先（该根 top:56px 即顶栏高度，隐藏顶栏后留下空白）。
    let headerHiddenState = true; // 顶部导航默认隐藏
    const getMessagePanelRoots = () => {
      const roots = new Set();
      const anchors = document.querySelectorAll(
        '#im-entry-vmok-popup-portal, [data-e2e="im-dialog"]'
      );
      for (const a of anchors) {
        let el = a;
        while (el && el !== document.body) {
          if (getComputedStyle(el).position === "fixed") {
            roots.add(el);
            break;
          }
          el = el.parentElement;
        }
      }
      return [...roots];
    };
    const adjustMessagePanels = (hidden) => {
      for (const el of getMessagePanelRoots()) {
        el.style.top = hidden ? "0px" : ""; // 隐藏顶栏时贴顶，显示时还原为抖音原生定位
      }
    };
    const onMouseMove = (event) => {
      /* 边缘临界值判定置于节流之前，理由同左侧导航：甩到顶边的关键事件不可被节流丢弃 */
      const atEdge = event.clientY <= EDGE_TRIGGER_PX;
      const now = Date.now();
      if (!atEdge) {
        if (now - lastTime < THROTTLE_MS) return;
        lastTime = now;
      }
      const $header = $("#douyin-header");
      if (!$header) return;
      const isVisible = $header.classList.contains("dy-header-hover-visible");
      /* 滞回（保持）判定：同左侧导航，避免下滑动画未覆盖光标时被误判为「已离开」 */
      const shouldShow =
        atEdge || (isVisible && event.clientY <= ($header.offsetHeight || 56));
      if (shouldShow && !isVisible) {
        $header.classList.add("dy-header-hover-visible");
        headerHiddenState = false;
        adjustMessagePanels(false);
      } else if (!shouldShow && isVisible) {
        $header.classList.remove("dy-header-hover-visible");
        headerHiddenState = true;
        adjustMessagePanels(true);
      }
    };
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    result.push(() => document.removeEventListener("mousemove", onMouseMove));
    // 顶部导航已隐藏时，若「消息」面板稍后打开，主动贴顶消除空白
    let moTimer = 0;
    const mo = new MutationObserver(() => {
      if (!headerHiddenState) return;
      const t = Date.now();
      if (t - moTimer < 300) return;
      moTimer = t;
      adjustMessagePanels(true);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    result.push(() => mo.disconnect());
    adjustMessagePanels(true); // 处理页面加载时即打开的面板
    result.push(() => {
      // 功能被关闭时：还原顶栏与消息面板定位
      $("#douyin-header")?.classList.remove("dy-header-hover-visible");
      adjustMessagePanels(false);
    });
    return result;
  };

  /* ---------------- 功能四：视频 bottom 偏移移除（增强版） ---------------- */

  const initVideoBottom = () => {
    log.info("移除video的bottom偏移（增强版）");
    const result = [];
    result.push(
      addStyle(`
        div:has( > div > pace-island > #video-info-wrap ),
        xg-video-container.xg-video-container,
        .douyin-player-video-container{
          bottom: 0 !important;
        }
      `)
    );
    /* 抖音切换/加载视频时会重建容器，仅靠 CSS 对后出现的视频可能失效；
       这里用 MutationObserver 给每个 xg-video-container 直接写入行内 !important，确保后加载的视频也生效 */
    /* 深度查询，兼容 xgplayer 的 Shadow DOM（普通 querySelectorAll 无法穿透） */
    const queryDeep = (selector) => {
      const out = [];
      const walk = (root) => {
        root.querySelectorAll(selector).forEach((el) => out.push(el));
        root.querySelectorAll("*").forEach((el) => {
          if (el.shadowRoot) walk(el.shadowRoot);
        });
      };
      walk(document);
      return out;
    };
    const lockRun = throttle(() => {
      queryDeep("xg-video-container, .douyin-player-video-container").forEach(($el) => {
        if (
          $el.style.getPropertyPriority("bottom") === "important" &&
          $el.style.getPropertyValue("bottom") === "0px"
        )
          return;
        $el.style.setProperty("bottom", "0px", "important");
      });
    }, 300);
    const observer = new MutationObserver(() => lockRun());
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    lockRun(); // immediate：处理页面加载时已存在的视频容器
    result.push(() => observer.disconnect());
    return result;
  };

  /* ---------------- 功能装配：开关 + 即时启停 + 菜单 ---------------- */

  const FEATURES = {
    leftNavHover: initLeftNavHover,
    topNavHover: initTopNavHover,
    videoBottom: initVideoBottom,
  };

  /** key -> cleanup[]，记录当前已启用功能的清理函数 */
  const activeCleanups = new Map();

  const stopFeature = (key) => {
    const cleanups = activeCleanups.get(key);
    if (!cleanups) return;
    activeCleanups.delete(key);
    for (const cleanup of cleanups) {
      try {
        cleanup();
      } catch (e) {
        log.error(`清理功能 ${key} 时出错`, e);
      }
    }
  };

  const startFeature = (key) => {
    if (activeCleanups.has(key)) return;
    try {
      activeCleanups.set(key, FEATURES[key]() || []);
    } catch (e) {
      log.error(`启动功能 ${key} 时出错`, e);
    }
  };

  const applyFeature = (key, enable) => {
    if (enable) {
      startFeature(key);
    } else {
      stopFeature(key);
    }
  };

  /** 重建脚本管理器菜单（条目文本反映当前开关状态） */
  let menuIds = [];
  const refreshMenus = () => {
    if (typeof GM_registerMenuCommand !== "function") return;
    if (typeof GM_unregisterMenuCommand === "function") {
      for (const id of menuIds) {
        try {
          GM_unregisterMenuCommand(id);
        } catch (e) {
          /* 忽略：部分管理器不支持按 id 注销 */
        }
      }
    }
    menuIds = [];
    for (const [key, cfg] of Object.entries(SETTINGS)) {
      const on = getVal(cfg.key, cfg.def);
      const id = GM_registerMenuCommand(
        `${on ? "✅ 已启用" : "⬜ 已禁用"}｜${cfg.name}（点击切换）`,
        () => {
          const next = !getVal(cfg.key, cfg.def);
          setVal(cfg.key, next);
          applyFeature(key, next);
          refreshMenus();
          log.info(`${cfg.name}：${next ? "已启用" : "已禁用"}`);
        }
      );
      menuIds.push(id);
    }
  };

  /* ---------------- 启动 ---------------- */

  const boot = () => {
    for (const [key, cfg] of Object.entries(SETTINGS)) {
      if (getVal(cfg.key, cfg.def)) startFeature(key);
    }
    refreshMenus();
  };

  if (document.readyState === "loading") {
    // document-start 时 DOM 未就绪：mousemove 监听可直接挂 document，
    // 但 MutationObserver 需要 document.body / documentElement 存在，故等 DOM 解析完成再启动
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
