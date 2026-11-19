/** Starts the page: language first, then the things that move, then the small controls. */
import { setLang, preferredLang, lang, onLang } from './i18n.js';
import { initBarDemo } from './bar-demo.js';
import { initStages } from './stages.js';

const byId = id => document.getElementById(id);

/**
 * The memo is really encrypted, here, with a key made for this visit that never leaves the tab.
 * Each keystroke seals it again under a fresh nonce, so the whole of the server's copy changes every time.
 * The laptop's copy reads the same as the phone's: a device of yours can open it.
 */
async function initSeal() {
  if (!crypto.subtle) return; // not a secure context: the still text stays
  const memo = byId('memo');
  const output = byId('cipher');
  const copy = byId('memo-copy');
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const seal = async () => {
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(memo.value);
    const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, plain));
    output.textContent = btoa(String.fromCharCode(...nonce, ...sealed));
    copy.textContent = memo.value;
  };
  memo.addEventListener('input', seal);
  onLang(seal);
  seal();
}

function initLanguagePicker() {
  const picker = byId('lang');
  picker.value = lang();
  picker.addEventListener('change', async () => {
    await setLang(picker.value);
    const url = new URL(location.href);
    if (lang() === 'en') url.searchParams.delete('lang');
    else url.searchParams.set('lang', lang());
    history.replaceState(null, '', url);
  });
}

/** The visitor's own platform leads the icon row. */
function markPlatform() {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua) ? 'android' : /Mac|iPhone|iPad/i.test(ua) ? 'apple' : /Win/i.test(ua) ? 'windows' : /Linux/i.test(ua) ? 'linux' : null;
  document.querySelector(`.plat[data-os="${os}"]`)?.classList.add('me');
}

await setLang(preferredLang());
initBarDemo();
initStages();
initSeal();
initLanguagePicker();
markPlatform();
