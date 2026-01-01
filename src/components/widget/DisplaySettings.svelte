<!-- DisplaySettings.svelte -->
<script lang="ts">
import { onMount } from "svelte";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import { getDefaultHue, getHue, setHue } from "@utils/setting-utils";

/*
  改動重點總結：
  - 把「主色」變更變成全局（設定 CSS 變數 --hue / --primary）。
  - 新增 background control: brightness (--bg-brightness)、global blur (--global-blur)、remove background (html.bg-removed).
  - 設定保存到 localStorage（page reload 後仍保留）。
  - 面板樣式刻意調成「醜到爆」以符合你的要求 😈
*/

const defaultHue = getDefaultHue();
let hue = getHue();
let bgBrightness = Number(getComputedStyle(document.documentElement).getPropertyValue('--bg-brightness')) || 1.15;
let globalBlur = Number(getComputedStyle(document.documentElement).getPropertyValue('--global-blur')) || 22;
let bgRemoved = document.documentElement.classList.contains('bg-removed') || false;

function clamp(n:number, a:number, b:number){ return Math.min(b, Math.max(a, n)); }

function persistSettings() {
  localStorage.setItem('ui:hue', String(hue));
  localStorage.setItem('ui:bg-brightness', String(bgBrightness));
  localStorage.setItem('ui:global-blur', String(globalBlur));
  localStorage.setItem('ui:bg-removed', bgRemoved ? '1' : '0');
}

function applyAll() {
  setHue(hue);
  document.documentElement.style.setProperty('--hue', String(hue));
  const hsl = `hsl(${Math.round(hue)} 66% 48%)`;
  document.documentElement.style.setProperty('--primary', hsl);
  document.documentElement.style.setProperty('--bg-brightness', String(bgBrightness));
  document.documentElement.style.setProperty('--global-blur', `${globalBlur}px`);
  if (bgRemoved) document.documentElement.classList.add('bg-removed'); else document.documentElement.classList.remove('bg-removed');
}

function hslToRgb(h:number, s:number, l:number) {
  s /= 100;
  l /= 100;
  const k = (n:number) => (n + h/30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n:number) => {
    const x = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * x);
  };
  return [f(0), f(8), f(4)];
}
function rgbToHex([r,g,b]:number[]) {
  const toHex = (v:number) => v.toString(16).padStart(2,'0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function hueToHex(h:number) {
  const rgb = hslToRgb(h, 66, 48);
  return rgbToHex(rgb);
}

let colorHex = hueToHex(hue);

onMount(() => {
  const savedHue = localStorage.getItem('ui:hue');
  const savedBrightness = localStorage.getItem('ui:bg-brightness');
  const savedBlur = localStorage.getItem('ui:global-blur');
  const savedRemoved = localStorage.getItem('ui:bg-removed');

  if (savedHue !== null) hue = clamp(Number(savedHue), 0, 360);
  if (savedBrightness !== null) bgBrightness = clamp(Number(savedBrightness), 0.3, 2);
  if (savedBlur !== null) globalBlur = clamp(Number(savedBlur), 0, 60);
  if (savedRemoved !== null) bgRemoved = savedRemoved === '1';

  colorHex = hueToHex(hue);
  applyAll();
});

$: if (hue !== undefined) {
  setHue(hue);
  colorHex = hueToHex(hue);
  applyAll();
}

function onHexChange(e: Event) {
  const v = (e.target as HTMLInputElement).value.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(v)) return;
  const hex = v.startsWith('#') ? v : `#${v}`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const rr = r/255, gg = g/255, bb = b/255;
  const max = Math.max(rr,gg,bb), min = Math.min(rr,gg,bb);
  let hval = 0;
  if (max === min) hval = 0;
  else {
    const d = max - min;
    switch(max) {
      case rr: hval = ((gg - bb) / d) % 6; break;
      case gg: hval = (bb - rr) / d + 2; break;
      case bb: hval = (rr - gg) / d + 4; break;
    }
    hval = Math.round(hval * 60);
    if (hval < 0) hval += 360;
  }
  hue = clamp(hval, 0, 360);
  colorHex = hex;
  persistSettings();
}

function applyAndSave() {
  persistSettings();
  applyAll();
}

function resetAll() {
  const defaultHue = getDefaultHue();
  hue = defaultHue;
  bgBrightness = 1.15;
  globalBlur = 22;
  bgRemoved = false;
  colorHex = hueToHex(hue);
  persistSettings();
  applyAll();
}

export function openPanel() {
  const el = document.getElementById('display-setting');
  if (el) el.classList.remove('float-panel-closed');
}
export function closePanel() {
  const el = document.getElementById('display-setting');
  if (el) el.classList.add('float-panel-closed');
}
</script>

<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-4" role="dialog" aria-label="Display Settings">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <div style="font-family: 'Comic Sans MS', 'Segoe UI', sans-serif; color:#0b1226; background:linear-gradient(90deg,#ff3cac,#7847ff); padding:6px 10px; border-radius:6px; border:3px dashed #ffe100; box-shadow: 6px 6px 0 rgba(0,0,0,0.08); font-weight:800;">
        <Icon icon="mdi:palette" style="vertical-align:middle; margin-right:6px;"></Icon>
        調色（全局）
      </div>
    </div>

    <div class="flex gap-2">
      <button class="px-2 py-1 rounded text-xs" on:click={resetAll} title="Reset">Reset</button>
      <button class="px-2 py-1 rounded text-xs" on:click={() => { closePanel(); }} title="Close">Close</button>
    </div>
  </div>

  <div class="space-y-3">
    <div>
      <label class="block text-xs font-semibold mb-1">主色 Hue：<span style="font-weight:700">{Math.round(hue)}</span>°</label>
      <input type="range" min="0" max="360" step="1" bind:value={hue} style="width:100%" />
      <div class="flex items-center gap-2 mt-2">
        <input type="color" bind:value={colorHex} on:input={(e)=>{ colorHex = (e.target as HTMLInputElement).value; onHexChange(e); }} class="w-10 h-8 p-0 border rounded" />
        <input type="text" class="flex-1 px-2 py-1 border rounded text-sm" bind:value={colorHex} on:change={onHexChange} />
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold mb-1">背景明度（亮度）: <strong>{bgBrightness.toFixed(2)}</strong></label>
      <input type="range" min="0.4" max="1.9" step="0.01" bind:value={bgBrightness} on:input={() => { document.documentElement.style.setProperty('--bg-brightness', String(bgBrightness)); }} style="width:100%" />
      <div class="text-xs text-muted mt-1">預設 1.15 — 增加值會讓背景更亮</div>
    </div>

    <div>
      <label class="block text-xs font-semibold mb-1">玻璃/模糊強度（全局）: <strong>{Math.round(globalBlur)}px</strong></label>
      <input type="range" min="0" max="40" step="1" bind:value={globalBlur} on:input={() => { document.documentElement.style.setProperty('--global-blur', `${globalBlur}px`); }} style="width:100%" />
      <div class="text-xs text-muted mt-1">建議手機上調小（或關閉）</div>
    </div>

    <div class="flex items-center gap-3">
      <input id="bg-remove-toggle" type="checkbox" bind:checked={bgRemoved} on:change={() => { if (bgRemoved) document.documentElement.classList.add('bg-removed'); else document.documentElement.classList.remove('bg-removed'); }} />
      <label for="bg-remove-toggle" class="text-sm">移除背景（顯示純色）</label>
    </div>

    <div class="flex items-center gap-2 mt-2">
      <button class="px-3 py-2 rounded bg-[var(--primary)] text-white font-bold" on:click={applyAndSave}>套用並儲存</button>
      <button class="px-3 py-2 rounded border" on:click={() => { resetAll(); }}>回復預設</button>
    </div>
  </div>

  <div style="margin-top:12px; font-size:11px; color:#222; background:linear-gradient(90deg,#fff2, #0001); padding:6px; border-radius:4px; border:2px solid #ff4d4d; box-shadow: 2px 2px 0 #ff4d4d;">
    <strong>提示：</strong> 這是全局設定，會立即影響網站色彩與背景。重新整理後仍保留。
  </div>
</div>

<style>
#display-setting {
  font-family: "Segoe UI", "Noto Sans", system-ui, -apple-system, "Helvetica Neue", Arial;
  width: 20rem;
  background: linear-gradient(135deg, #fff 0%, #fefefe 40%, #fff 100%);
  border: 4px dashed #ff8800;
  box-shadow:
    8px 8px 0 rgba(0,0,0,0.06),
    -6px -6px 0 rgba(255,255,0,0.06);
  color: #111;
  border-radius: 10px;
  z-index: 1000;
}

#display-setting input[type="range"] {
  -webkit-appearance: none;
  height: 0.6rem;
  background: linear-gradient(90deg, #ff9a9e, #fad0c4, #fbc2eb);
  border-radius: 6px;
  outline: none;
}
#display-setting input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 12px;
  background: #fff;
  border: 2px solid #ff4d4d;
  border-radius: 3px;
}
#display-setting input[type="color"] { border: 2px solid #111; padding: 0; }

:root {
  --global-blur: 22px;
}
.glass, .card-base, footer {
  backdrop-filter: blur(var(--global-blur));
  -webkit-backdrop-filter: blur(var(--global-blur));
}

html.bg-removed body::before {
  background-image: none !important;
  background-color: var(--bg-fallback, #f3f4f6) !important;
  filter: none !important;
}

@media (max-width: 640px) {
  #display-setting { right: 8px; left: 8px; width: calc(100% - 32px); }
}
</style>
```0
