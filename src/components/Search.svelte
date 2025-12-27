<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { url } from "@utils/url-utils.ts";
import { onDestroy, onMount } from "svelte";
import { fade, scale } from "svelte/transition";

let searchKeyword = "";
let isPanelOpen = false;
let portalTarget: HTMLElement;

// 监听 URL 变化并更新搜索关键词
let currentUrl = "";
$: if (typeof window !== "undefined") {
	const newUrl = window.location.href;
	if (newUrl !== currentUrl) {
		currentUrl = newUrl;
		const urlParams = new URLSearchParams(window.location.search);
		const qParam = urlParams.get("q");
		searchKeyword = qParam || "";
	}
}

onMount(() => {
	// 创建一个挂载到 body 的容器，确保全屏显示
	portalTarget = document.createElement("div");
	portalTarget.id = "search-portal";
	portalTarget.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 9999;
	`;
	document.body.appendChild(portalTarget);

	const updateKeywordFromUrl = () => {
		searchKeyword = "";
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const q = params.get("q");
			searchKeyword = q || "";
		}
	};

	// 首次加载时更新
	updateKeywordFromUrl();

	// 监听 swup 页面转换事件
	document.addEventListener("swup:contentReplaced", updateKeywordFromUrl);

	return () => {
		if (portalTarget?.parentNode) {
			portalTarget.parentNode.removeChild(portalTarget);
		}
		document.removeEventListener("swup:contentReplaced", updateKeywordFromUrl);
	};
});

const togglePanel = () => {
	isPanelOpen = !isPanelOpen;
	if (isPanelOpen) {
		// 打开面板时清空搜索框
		searchKeyword = "";
		// 禁止页面滚动
		if (typeof document !== "undefined" && document.body) {
			document.body.style.overflow = "hidden";
		}
		// 延迟聚焦，确保面板已经显示
		setTimeout(() => {
			const input = document.getElementById("search-input");
			input?.focus();
		}, 200);
	} else {
		// 恢复页面滚动
		if (typeof document !== "undefined" && document.body) {
			document.body.style.overflow = "";
		}
	}
};

const closePanel = () => {
	isPanelOpen = false;
	// 恢复页面滚动
	if (typeof document !== "undefined" && document.body) {
		document.body.style.overflow = "";
	}
};

const goToSearchPage = () => {
	const search = searchKeyword.trim();

	if (searchKeyword.trim()) {
		// 先清空搜索框，再跳转到搜索页面
		const queryParam = encodeURIComponent(searchKeyword.trim());
		searchKeyword = "";
		window.location.href = url(`/search/?q=${queryParam}`);
	} else {
		// 清空搜索框并跳转到搜索页面
		searchKeyword = "";
		window.location.href = url("/search/");
	}
};

const handleKeyPress = (event: KeyboardEvent) => {
	if (event.key === "Enter") {
		goToSearchPage();
	}
};

// ESC键关闭面板
const handleKeyDown = (event: KeyboardEvent) => {
	if (event.key === "Escape" && isPanelOpen) {
		closePanel();
	}
};

// 监听键盘事件
if (typeof window !== "undefined") {
	document.addEventListener("keydown", handleKeyDown);
}

// 组件销毁时清理
onDestroy(() => {
	// 恢复页面滚动
	if (typeof document !== "undefined" && document.body) {
		document.body.style.overflow = "";
	}
	// 移除键盘事件监听
	if (typeof document !== "undefined") {
		document.removeEventListener("keydown", handleKeyDown);
	}
});
</script>

<!-- 搜索按钮 -->
<button 
	on:click={togglePanel} 
	aria-label="搜尋" 
	id="search-switch"
	class="btn-plain scale-animation rounded-lg w-11 h-11 active:scale-90 flex items-center justify-center"
>
	<Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- 搜索弹框 -->
{#if isPanelOpen}
<!-- 背景遮罩 -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
	class="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm z-40"
	style="width: 100vw; height: 100vh; top: 0; left: 0; margin: 0; padding: 0;"
	on:click={closePanel}
	transition:fade={{ duration: 200 }}
></div>

<!-- 搜索弹框 -->
<div 
	class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4"
>
	<div class="w-full max-w-2xl mx-auto" transition:scale={{ duration: 300, start: 0.9 }}>
		<!-- 搜索容器 -->
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative">
			<!-- 关闭按钮 -->
			<button 
				on:click={closePanel}
				class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl transition-colors"
				aria-label="關閉搜尋"
			>
				<Icon icon="material-symbols:close" />
			</button>

			<!-- 搜索标题 -->
			<h2 class="text-xl font-medium text-gray-700 dark:text-gray-200 mb-6">搜尋</h2>

			<!-- 搜索框 -->
			<div class="flex gap-3 mb-6">
				<div class="flex-1 relative">
					<input
						id="search-input"
						bind:value={searchKeyword}
						type="text"
						placeholder="搜尋點什麼？"
						class="search-input w-full pl-4 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
						on:keypress={handleKeyPress}
					/>
				</div>
				<button
					class="search-button px-6 py-3 bg-blue-500 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
					on:click={goToSearchPage}
				>
					<Icon icon="material-symbols:search" />
					搜尋
				</button>
			</div>


		</div>
	</div>
</div>
{/if}

<style>
/* 拟态效果增强 */
.neumorphism {
	background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1));
	box-shadow: 
		20px 20px 60px rgba(0,0,0,0.1),
		-20px -20px 60px rgba(255,255,255,0.1),
		inset 5px 5px 10px rgba(0,0,0,0.05),
		inset -5px -5px 10px rgba(255,255,255,0.05);
}

/* 键盘按键样式 */
kbd {
	font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	font-weight: 600;
	border: 1px solid rgba(0,0,0,0.1);
	border-bottom: 2px solid rgba(0,0,0,0.2);
	box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

/* 动画增强 */
@keyframes float {
	0%, 100% { transform: translateY(0px); }
	50% { transform: translateY(-5px); }
}

.animate-float {
	animation: float 3s ease-in-out infinite;
}

/* 搜索框样式优化 */
.search-input {
	font-size: 16px;
	line-height: 1.5;
	border: 1px solid rgba(138, 180, 248, 0.3);
	backdrop-filter: blur(10px);
}

.search-input:focus {
	outline: none;
	transform: scale(1.01);
	box-shadow: 0 0 0 3px rgba(138, 180, 248, 0.2);
	transition: .2s;
}

/* 输入框占位符样式 */
.search-input::placeholder {
	color: #9ca3af;
	transition: color 0.2s ease;
}

:global(.dark) .search-input::placeholder {
	color: #6b7280;
}

.search-input:focus::placeholder {
	color: #d1d5db;
}

:global(.dark) .search-input:focus::placeholder {
	color: #4b5563;
}

/* 暗色模式下的拟态效果 */
:global(.dark) .neumorphism {
	background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2));
	box-shadow: 
		20px 20px 60px rgba(0,0,0,0.3),
		-20px -20px 60px rgba(255,255,255,0.05),
		inset 5px 5px 10px rgba(0,0,0,0.1),
		inset -5px -5px 10px rgba(255,255,255,0.02);
}

/* 通用输入框样式 */
input:focus {
	outline: 0;
}

/* 搜索按钮样式 */
.search-button {
	font-weight: 500;
	background: #8ab4f8;
}

.search-button:hover {
	background: #7aaaf5;
	transition: .3s;
}

/* 搜索面板样式 */
.search-panel {
	max-height: calc(100vh - 100px);
	overflow-y: auto;
}
</style>