import { h as T, LOCAL_NOTE, dlNodePng, fileInput } from '../../core.js';

export const meta = {"id":"fake-feed-ig","name":"Fake Feed Instagram","cat":"fakesos","icon":"📱","desc":"Bikin screenshot feed home Instagram palsu: baris story, dua postingan, dan tab bar. Unduh PNG.","keywords":"instagram,feed,home,story,postingan,fake,palsu,screenshot,prank","since": "6.18.0"};

const FFI_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const FFI_RED = '#FF3040';
const FFI_BLUE = '#0095F6';
const FFI_STORY_GRAD = 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)';
/* Wordmark "Instagram": path dari theSVG (glincker/thesvg, MIT) public/icons/instagram/wordmark.svg — fill di-override ke currentColor (sama seperti fake-post-ig.js) */
const FFI_WM_D = "M27.127.902C16.68 5.278 5.197 17.625 1.57 33.135C-3.024 52.78 16.09 61.09 17.659 58.369c1.845-3.201-3.425-4.283-4.51-14.477c-1.402-13.166 4.719-27.877 12.423-34.332c1.43-1.2 1.363.47 1.363 3.557c0 5.521-.305 55.085-.305 65.429c0 13.996-.578 18.416-1.617 22.784c-1.051 4.425-2.743 7.416-1.462 8.568c1.432 1.288 7.546-1.777 11.085-6.716c4.244-5.924 5.73-13.04 5.997-20.765c.322-9.314.308-24.094.322-32.524c.012-7.731.13-30.37-.136-43.98c-.065-3.34-9.323-6.842-13.692-5.011M398.07 66.405c-.337 7.277-1.948 12.964-3.947 16.976c-3.87 7.767-11.9 10.178-15.31-.986c-1.858-6.086-1.945-16.25-.61-24.743c1.36-8.651 5.158-15.185 11.445-14.596c6.202.583 9.105 8.574 8.422 23.35m-104.55 45.146c-.084 12.09-1.987 22.69-6.067 25.77c-5.788 4.366-13.567 1.09-11.956-7.732c1.425-7.807 8.166-15.78 18.04-25.522c0 0 .02 2.222-.017 7.484m-1.58-45.217c-.354 6.628-2.072 13.285-3.947 17.047c-3.87 7.767-11.958 10.195-15.31-.986c-2.292-7.64-1.743-17.526-.61-23.756c1.472-8.083 5.04-15.582 11.445-15.582c6.228 0 9.3 6.833 8.422 23.277m-60.565-.1c-.38 7.018-1.749 12.885-3.946 17.147c-3.976 7.714-11.842 10.16-15.31-.986c-2.501-8.037-1.65-18.995-.61-24.915c1.544-8.785 5.41-15.013 11.445-14.423c6.199.606 9.212 8.573 8.421 23.177m277.553 8.198c-1.515 0-2.207 1.562-2.78 4.19c-1.983 9.144-4.07 11.207-6.759 11.207c-3.005 0-5.705-4.526-6.4-13.588c-.545-7.126-.457-20.244.24-33.293c.143-2.681-.597-5.334-7.788-7.946c-3.094-1.124-7.592-2.779-9.832 2.627c-6.327 15.274-8.803 27.4-9.386 32.324c-.03.255-.343.308-.397-.288c-.372-3.945-1.201-11.115-1.305-26.177c-.02-2.939-.642-5.44-3.886-7.488c-2.105-1.33-8.496-3.68-10.797-.883c-1.994 2.286-4.304 8.44-6.703 15.736c-1.95 5.93-3.308 9.94-3.308 9.94s.026-15.998.049-22.067c.01-2.289-1.56-3.052-2.034-3.19c-2.13-.618-6.33-1.651-8.112-1.651c-2.2 0-2.738 1.228-2.738 3.02c0 .235-.347 21.063-.347 35.627c0 .633 0 1.323.003 2.057c-1.216 6.694-5.161 15.78-9.451 15.78c-4.296 0-6.322-3.798-6.322-21.161c0-10.129.304-14.534.453-21.86c.087-4.22.255-7.46.245-8.195c-.032-2.255-3.93-3.392-5.745-3.812c-1.823-.423-3.407-.588-4.644-.517c-1.751.1-2.99 1.247-2.99 2.827c0 .848.01 2.458.01 2.458c-2.255-3.544-5.882-6.01-8.295-6.725c-6.5-1.93-13.282-.22-18.398 6.939c-4.066 5.687-6.517 12.13-7.482 21.385c-.705 6.767-.475 13.628.779 19.431c-1.515 6.548-4.326 9.23-7.405 9.23c-4.47 0-7.71-7.294-7.334-19.912c.248-8.299 1.909-14.123 3.724-22.549c.774-3.592.145-5.472-1.432-7.274c-1.447-1.653-4.53-2.498-8.96-1.46c-3.156.741-7.669 1.538-11.798 2.15c0 0 .25-.995.454-2.747c1.074-9.19-8.913-8.445-12.1-5.51c-1.901 1.753-3.196 3.82-3.687 7.536c-.78 5.898 4.03 8.68 4.03 8.68c-1.577 7.224-5.446 16.66-9.44 23.483c-2.139 3.655-3.775 6.364-5.888 9.243a1388 1388 0 0 1 .226-34.66c.087-4.22.256-7.374.247-8.11c-.024-1.648-.987-2.272-2.99-3.06c-1.772-.698-3.866-1.18-6.039-1.35c-2.742-.212-4.394 1.241-4.35 2.961c.008.325.008 2.319.008 2.319c-2.255-3.544-5.882-6.01-8.295-6.725c-6.5-1.93-13.282-.22-18.398 6.939c-4.065 5.687-6.727 13.669-7.482 21.315c-.702 7.125-.573 13.18.385 18.282c-1.033 5.108-4.005 10.45-7.364 10.45c-4.296 0-6.74-3.799-6.74-21.162c0-10.129.304-14.534.454-21.86c.087-4.219.254-7.46.245-8.195c-.032-2.255-3.931-3.391-5.746-3.812c-1.898-.44-3.537-.6-4.796-.507c-1.66.123-2.828 1.61-2.828 2.719v2.556c-2.255-3.544-5.882-6.01-8.295-6.725c-6.5-1.93-13.244-.192-18.398 6.939c-3.36 4.649-6.081 9.803-7.481 21.213c-.405 3.297-.584 6.386-.56 9.271c-1.34 8.196-7.26 17.642-12.101 17.642c-2.833 0-5.532-5.496-5.532-17.207c0-15.6.966-37.812 1.13-39.952c0 0 6.117-.104 7.301-.118c3.052-.034 5.815.039 9.88-.17c2.038-.103 4.002-7.42 1.898-8.325c-.954-.41-7.693-.768-10.365-.825c-2.246-.05-8.5-.514-8.5-.514s.561-14.743.692-16.3c.11-1.299-1.57-1.967-2.532-2.372c-2.342-.99-4.437-1.465-6.92-1.977c-3.432-.708-4.988-.015-5.292 2.88c-.458 4.395-.695 17.268-.695 17.268c-2.518 0-11.12-.492-13.638-.492c-2.34 0-4.866 10.064-1.63 10.188c3.722.144 10.209.27 14.509.398c0 0-.192 22.578-.192 29.55q.001 1.11.008 2.148c-2.367 12.335-10.703 18.999-10.703 18.999c1.79-8.161-1.867-14.29-8.454-19.478c-2.427-1.911-7.218-5.53-12.578-9.496c0 0 3.104-3.06 5.858-9.216c1.95-4.362 2.035-9.351-2.754-10.452c-7.912-1.82-14.435 3.991-16.381 10.195c-1.508 4.806-.704 8.371 2.25 12.075c.215.271.45.548.69.826c-1.785 3.442-4.239 8.077-6.317 11.671c-5.768 9.98-10.125 17.872-13.418 17.872c-2.632 0-2.597-8.014-2.597-15.517c0-6.468.478-16.193.86-26.26c.126-3.33-1.54-5.227-4.33-6.945c-1.696-1.044-5.315-3.096-7.411-3.096c-3.138 0-12.19.427-20.742 25.167c-1.078 3.118-3.196 8.8-3.196 8.8l.183-29.751c0-.698-.372-1.372-1.223-1.833c-1.441-.783-5.29-2.383-8.713-2.383q-2.445.001-2.445 2.27l-.298 46.546c0 3.537.092 7.663.442 9.467c.348 1.806.913 3.276 1.611 4.15c.699.873 1.506 1.54 2.837 1.814c1.239.255 8.023 1.126 8.376-1.466c.422-3.108.439-6.468 4.001-19.002C75.89 58.072 83.12 48.552 86.52 45.17c.595-.59 1.273-.626 1.24.341c-.144 4.278-.655 14.97-.998 24.05c-.921 24.305 3.5 28.81 9.819 28.81c4.834 0 11.648-4.803 18.952-16.961a4281 4281 0 0 0 12.153-20.36c2.213 2.049 4.698 4.254 7.18 6.61c5.77 5.476 7.664 10.68 6.407 15.616c-.96 3.773-4.581 7.662-11.024 3.883c-1.878-1.103-2.68-1.956-4.568-3.199c-1.014-.667-2.563-.867-3.492-.167c-2.412 1.818-3.792 4.132-4.58 6.996c-.766 2.787 2.025 4.26 4.919 5.549c2.491 1.109 7.846 2.114 11.26 2.228c13.305.445 23.964-6.424 31.384-24.143c1.328 15.303 6.98 23.962 16.801 23.962c6.566 0 13.149-8.487 16.028-16.836c.826 3.403 2.05 6.363 3.63 8.866c7.567 11.99 22.247 9.41 29.621-.772c2.28-3.146 2.627-4.276 2.627-4.276c1.076 9.613 8.818 12.972 13.25 12.972c4.965 0 10.09-2.347 13.683-10.435q.63 1.319 1.383 2.511c7.567 11.99 22.248 9.41 29.622-.772q.52-.716.913-1.3l.216 6.315l-6.789 6.227c-11.38 10.43-20.024 18.34-20.66 27.553c-.81 11.747 8.712 16.113 15.926 16.685c7.647.607 14.208-3.621 18.234-9.538c3.544-5.209 5.864-16.419 5.693-27.49c-.067-4.434-.18-10.071-.267-16.114c3.995-4.639 8.496-10.503 12.64-17.365c4.516-7.479 9.356-17.523 11.834-25.34c0 0 4.205.037 8.693-.257c1.435-.094 1.848.2 1.582 1.251c-.32 1.272-5.67 21.905-.787 35.65c3.341 9.41 10.874 12.436 15.34 12.436c5.229 0 10.23-3.948 12.91-9.81c.324.653.661 1.285 1.03 1.87c7.567 11.99 22.196 9.393 29.622-.773c1.676-2.294 2.627-4.276 2.627-4.276c1.593 9.95 9.331 13.023 13.763 13.023c4.616 0 8.998-1.893 12.552-10.304c.15 3.704.383 6.732.752 7.686c.225.585 1.537 1.317 2.491 1.671c4.224 1.566 8.53.826 10.124.504c1.104-.224 1.965-1.11 2.083-3.396c.31-6.005.12-16.094 1.94-23.593c3.055-12.583 5.906-17.464 7.258-19.88c.757-1.355 1.61-1.578 1.641-.145c.064 2.9.208 11.413 1.392 22.853c.87 8.412 2.03 13.385 2.923 14.96c2.548 4.5 5.693 4.713 8.255 4.713c1.63 0 5.038-.45 4.733-3.314c-.149-1.396.111-10.024 3.124-22.421c1.967-8.096 5.247-15.41 6.43-18.085c.437-.986.64-.209.632-.057c-.249 5.575-.808 23.811 1.463 33.785c3.08 13.511 11.986 15.023 15.09 15.023c6.626 0 12.045-5.04 13.87-18.302c.44-3.192-.211-5.656-2.162-5.656";
/* Segel verified IG: 12 gerigi (sama seperti fake-post-ig.js) */
const FFI_SEAL_D = "M10.8 2.01Q12 1 13.2 2.01Q14.41 3.02 15.95 2.75Q17.5 2.47 18.04 3.95Q18.58 5.42 20.05 5.96Q21.53 6.5 21.25 8.05Q20.98 9.59 21.99 10.8Q23 12 21.99 13.2Q20.98 14.41 21.25 15.95Q21.53 17.5 20.05 18.04Q18.58 18.58 18.04 20.05Q17.5 21.53 15.95 21.25Q14.41 20.98 13.2 21.99Q12 23 10.8 21.99Q9.59 20.98 8.05 21.25Q6.5 21.53 5.96 20.05Q5.42 18.58 3.95 18.04Q2.47 17.5 2.75 15.95Q3.02 14.41 2.01 13.2Q1 12 2.01 10.8Q3.02 9.59 2.75 8.05Q2.47 6.5 3.95 5.96Q5.42 5.42 5.96 3.95Q6.5 2.47 8.05 2.75Q9.59 3.02 10.8 2.01Z";

const FFI_PERSON = '<svg viewBox="0 0 24 24" width="62%" height="62%" fill="#b5b5b5" aria-hidden="true"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>';

const FFI_GRADS = {
  sunset: 'linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)',
  ocean: 'linear-gradient(135deg,#0095F6,#00D4FF)',
  ungu: 'linear-gradient(135deg,#962FBF,#4F5BD5)',
  hijau: 'linear-gradient(135deg,#22c55e,#a3e635)',
};

/* Ikon outline gaya IG: 24x24, stroke 2, round caps/joins */
const FFI_ST = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const FFI_P = {
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  comment: '<path d="M12 3.8c-4.8 0-8.3 3.3-8.3 7.6 0 2.4 1.2 4.5 3 5.9l-1.4 3.2 3.9-1.9c.9.3 1.8.4 2.8.4 4.8 0 8.3-3.3 8.3-7.6S16.8 3.8 12 3.8z"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  more: '<circle cx="5.2" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.9" fill="currentColor" stroke="none"/><circle cx="18.8" cy="12" r="1.9" fill="currentColor" stroke="none"/>',
  homeFill: '<path fill="currentColor" stroke="none" fill-rule="evenodd" d="M12 2.8l8.7 7.7v9.3a1.6 1.6 0 0 1-1.6 1.6H15v-6.6h-6v6.6H4.9a1.6 1.6 0 0 1-1.6-1.6v-9.3L12 2.8zM10.2 21.4v-7.2h3.6v7.2h-3.6z"/>',
  search: '<circle cx="11" cy="11" r="6.8"/><path d="M15.8 15.8l4.7 4.7"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  reels: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M4 9.3h16"/><path d="M8 4.6l1.7 4.7M13.2 4.6l1.7 4.7"/><path d="M10.3 12.3l4.6 2.6-4.6 2.6z" fill="currentColor" stroke="none"/>',
  messenger: '<path d="M12 3.6c-4.9 0-8.6 3.5-8.6 7.9 0 2.5 1.2 4.7 3.1 6.1l-1.2 3.4 4-2c.9.3 1.8.4 2.7.4 4.9 0 8.6-3.5 8.6-8S16.9 3.6 12 3.6z"/><path d="M13.4 7.2L8.9 13.4h2.9l-1.1 4 4.5-6.2h-2.9l1.1-4z" fill="currentColor" stroke="none"/>'
};

function ffiIcon(name) {
  return '<svg viewBox="0 0 24 24" ' + FFI_ST + ' aria-hidden="true">' + FFI_P[name] + '</svg>';
}
function ffiHeart(liked) {
  return liked
    ? '<svg viewBox="0 0 24 24" fill="' + FFI_RED + '" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
    : ffiIcon('heart');
}
function ffiVerified() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="' + FFI_BLUE + '" d="' + FFI_SEAL_D + '"/><path d="M8.3 12.4l2.6 2.7 5-5.9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function ffiWordmark() {
  return '<svg viewBox="0 0 512 146" fill="currentColor" aria-hidden="true"><path d="' + FFI_WM_D + '"/></svg>';
}

const FFI_CSS = `
.ffi-app{background:#fff;color:#000;font-family:${FFI_FONT};font-size:14px;line-height:1.4}
.ffi-app.dk{background:#000;color:#f5f5f5}
.ffi-topbar{display:flex;align-items:center;height:46px;padding:0 16px 0 12px;flex:none}
.ffi-wm{height:29px;display:flex;flex:none;color:inherit}
.ffi-wm svg{height:100%;width:auto;display:block}
.ffi-topicons{margin-left:auto;display:flex;align-items:center;gap:22px}
.ffi-ic24{width:24px;height:24px;display:inline-flex;flex:none;color:inherit}
.ffi-ic24 svg{width:100%;height:100%;display:block}
.ffi-stories{display:flex;gap:14px;padding:8px 12px 12px;overflow:hidden;flex:none}
.ffi-story{display:flex;flex-direction:column;align-items:center;gap:5px;width:64px;flex:none}
.ffi-sring{width:62px;height:62px;border-radius:50%;background:${FFI_STORY_GRAD};display:flex;align-items:center;justify-content:center;position:relative}
.ffi-sringin{width:58px;height:58px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ffi-app.dk .ffi-sringin{background:#000}
.ffi-sava{width:54px;height:54px;border-radius:50%;background:#efefef;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ffi-app.dk .ffi-sava{background:#262626}
.ffi-sava img{width:100%;height:100%;object-fit:cover;display:block}
.ffi-sname{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:64px}
.ffi-splus{position:absolute;right:0;bottom:0;width:20px;height:20px;border-radius:50%;background:#0095F6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;border:2px solid #fff;line-height:1}
.ffi-app.dk .ffi-splus{border-color:#000}
.ffi-head{display:flex;align-items:center;gap:10px;padding:8px 12px;min-height:48px}
.ffi-ava{width:32px;height:32px;border-radius:50%;background:#efefef;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center}
.ffi-app.dk .ffi-ava{background:#262626}
.ffi-hmeta{display:flex;flex-direction:column;line-height:1.3;min-width:0;justify-content:center}
.ffi-urow{display:flex;align-items:center;gap:4px;min-width:0}
.ffi-uname{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ffi-ver{width:12px;height:12px;flex:none;display:inline-flex}
.ffi-ver svg{width:100%;height:100%;display:block}
.ffi-more{margin-left:auto;width:24px;height:24px;flex:none;color:inherit;display:inline-flex;padding:0}
.ffi-more svg{width:100%;height:100%;display:block}
.ffi-photo{width:100%;aspect-ratio:1/1;background:#efefef;position:relative;overflow:hidden}
.ffi-app.dk .ffi-photo{background:#0a0a0a}
.ffi-photo img{width:100%;height:100%;object-fit:cover;display:block}
.ffi-grad{position:absolute;inset:0}
.ffi-actions{display:flex;align-items:center;gap:16px;min-height:44px;padding:6px 12px}
.ffi-save{margin-left:auto}
.ffi-body{padding:2px 12px 0}
.ffi-likes{font-size:14px;margin:0 0 5px}
.ffi-likes b{font-weight:600}
.ffi-cap{font-size:14px;line-height:1.45;margin:0 0 5px;white-space:pre-wrap;word-break:break-word}
.ffi-cap b{font-weight:600}
.ffi-comments{font-size:14px;color:#737373;margin:0 0 8px}
.ffi-app.dk .ffi-comments{color:#a8a8a8}
.ffi-time{font-size:11px;color:#737373;letter-spacing:.2px;margin:0 0 14px}
.ffi-app.dk .ffi-time{color:#a8a8a8}
.ffi-tabbar{display:flex;align-items:center;justify-content:space-around;height:50px;border-top:1px solid #dbdbdb;flex:none}
.ffi-app.dk .ffi-tabbar{border-top-color:#262626}
.ffi-tab{width:44px;height:44px;display:flex;align-items:center;justify-content:center;color:inherit;flex:none}
.ffi-tabava{width:26px;height:26px;border-radius:50%;background:#efefef;overflow:hidden;display:flex;align-items:center;justify-content:center}
.ffi-app.dk .ffi-tabava{background:#262626}
.ffi-delphoto{font-size:12px;color:#ed4956;background:none;border:none;padding:0;cursor:pointer;margin-top:6px}
.ffi-dev{max-width:430px;margin:14px auto;background:#0d0d0d;border-radius:42px;padding:11px;box-shadow:0 20px 55px rgba(0,0,0,.35),inset 0 0 0 2px #2b2b2b}
.ffi-scr{border-radius:32px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.ffi-scr.dk{background:#000}
.ffi-sb{position:relative;display:flex;align-items:center;justify-content:space-between;padding:11px 22px 4px;font-size:15px;font-weight:600;flex:none;color:#111}
.ffi-scr.dk .ffi-sb{color:#f5f5f5}
.ffi-home{width:134px;height:5px;border-radius:3px;background:#111;margin:10px auto 8px;flex:none}
.ffi-scr.dk .ffi-home{background:#f5f5f5}
.ffi-anav{display:flex;justify-content:center;padding:8px 0 10px;flex:none}
.ffi-anav i{display:block;width:120px;height:4px;border-radius:2px;background:#111}
.ffi-scr.dk .ffi-anav i{background:#f5f5f5}
.ffi-pranktag-wrap{display:flex;justify-content:center;padding:8px 0 12px;flex:none}
.ffi-pranktag{font-size:11px;font-weight:600;color:#ffffffaa;background:#00000088;padding:5px 10px;border-radius:20px}
`;

function ffiFmt(v) {
  const n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10);
  return (isNaN(n) ? 0 : n).toLocaleString('id-ID');
}
function ffiNum(v) {
  const n = parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

export function render(root) {
  const style = document.createElement('style');
  style.textContent = FFI_CSS;
  root.appendChild(style);

  let photoUrl = null;

  const mkPost = (n) => ({
    user: T.input('text', 'cth: adip.rmx', ''),
    ver: T.select([['ya', 'Ya'], ['tidak', 'Tidak']], 'tidak'),
    cap: T.ta(2, 'Tulis caption...', ''),
    likes: T.input('number', 'cth: 1234', ''),
    com: T.input('number', 'cth: 48', ''),
    time: T.input('text', 'cth: 2 JAM YANG LALU', '2 JAM YANG LALU'),
    like: T.select([['ya', 'Ya'], ['tidak', 'Tidak']], 'tidak'),
    n,
  });
  const p1 = mkPost(1);
  const p2 = mkPost(2);
  const storyInps = [1, 2, 3, 4].map((i) => T.input('text', 'cth: teman' + i, ''));
  const fi = fileInput('image/*');
  const gradSel = T.select([['sunset', 'Sunset'], ['ocean', 'Ocean'], ['ungu', 'Ungu'], ['hijau', 'Hijau']], 'sunset');
  const grad2Sel = T.select([['ocean', 'Ocean'], ['sunset', 'Sunset'], ['ungu', 'Ungu'], ['hijau', 'Hijau']], 'ocean');
  const themeSel = T.select([['terang', 'Terang'], ['gelap', 'Gelap']], 'terang');
  const selPlatform = T.select([['android', 'Android'], ['iphone', 'iPhone']], 'android');
  const selBrand = T.select([['xiaomi', 'Xiaomi'], ['samsung', 'Samsung'], ['oppo', 'Oppo'], ['vivo', 'Vivo'], ['realme', 'Realme'], ['oneplus', 'OnePlus'], ['infinix', 'Infinix'], ['tecno', 'Tecno'], ['motorola', 'Motorola'], ['nothing', 'Nothing'], ['pixel', 'Pixel'], ['huawei', 'Huawei'], ['honor', 'Honor']], 'xiaomi');
  const delPhoto = T.el('<button type="button" class="ffi-delphoto">Hapus foto sendiri</button>');
  delPhoto.style.display = 'none';
  const preview = T.out();

  fi.addEventListener('change', () => {
    if (fi.files[0]) { photoUrl = URL.createObjectURL(fi.files[0]); delPhoto.style.display = ''; draw(); }
  });
  delPhoto.addEventListener('click', () => {
    photoUrl = null; fi.value = ''; delPhoto.style.display = 'none'; draw();
  });

  function postHtml(p, photo) {
    const uname = p.user.value.trim() || 'username';
    const verified = p.ver.value === 'ya';
    const liked = p.like.value === 'ya';
    const nLikes = ffiNum(p.likes.value);
    const cCount = ffiNum(p.com.value);
    const cap = p.cap.value;
    const timeT = p.time.value.trim() || '2 JAM YANG LALU';
    let h = '<div class="ffi-head">'
      + '<div class="ffi-ava">' + FFI_PERSON + '</div>'
      + '<div class="ffi-hmeta"><span class="ffi-urow"><span class="ffi-uname">' + T.esc(uname) + '</span>' + (verified ? '<span class="ffi-ver">' + ffiVerified() + '</span>' : '') + '</span></div>'
      + '<span class="ffi-more">' + ffiIcon('more') + '</span>'
      + '</div>';
    h += '<div class="ffi-photo">' + photo + '</div>';
    h += '<div class="ffi-actions">'
      + '<span class="ffi-ic24">' + ffiHeart(liked) + '</span>'
      + '<span class="ffi-ic24">' + ffiIcon('comment') + '</span>'
      + '<span class="ffi-ic24">' + ffiIcon('send') + '</span>'
      + '<span class="ffi-ic24 ffi-save">' + ffiIcon('bookmark') + '</span>'
      + '</div>';
    h += '<div class="ffi-body">';
    h += '<div class="ffi-likes">' + (nLikes > 0
      ? 'Disukai oleh <b>' + T.esc(uname) + '</b> dan <b>' + T.esc(ffiFmt(nLikes)) + '</b> lainnya'
      : 'Disukai oleh <b>' + T.esc(uname) + '</b>') + '</div>';
    h += '<div class="ffi-cap"><b>' + T.esc(uname) + '</b>' + (cap.trim() ? ' ' + T.esc(cap) : '') + '</div>';
    if (cCount > 0) h += '<div class="ffi-comments">Lihat semua ' + T.esc(ffiFmt(cCount)) + ' komentar</div>';
    h += '<div class="ffi-time">' + T.esc(timeT) + '</div>';
    h += '</div>';
    return h;
  }

  function storyHtml(nama, pertama) {
    const label = pertama ? 'Cerita Anda' : (nama.trim() || 'teman');
    const plus = pertama ? '<span class="ffi-splus">+</span>' : '';
    return '<div class="ffi-story"><div class="ffi-sring"><div class="ffi-sringin"><div class="ffi-sava">' + FFI_PERSON + '</div></div>' + plus + '</div><span class="ffi-sname">' + T.esc(label) + '</span></div>';
  }

  function draw() {
    const dark = themeSel.value === 'gelap';
    const plat = selPlatform.value;
    const isIPh = plat === 'iphone';
    brandField.style.display = (plat === 'android') ? '' : 'none';
    const foto1 = photoUrl
      ? '<img src="' + T.esc(photoUrl) + '" alt="">'
      : '<div class="ffi-grad" style="background:' + FFI_GRADS[gradSel.value] + '"></div>';
    const foto2 = '<div class="ffi-grad" style="background:' + FFI_GRADS[grad2Sel.value] + '"></div>';

    let h = '<div class="ffi-topbar">'
      + '<span class="ffi-wm">' + ffiWordmark() + '</span>'
      + '<span class="ffi-topicons"><span class="ffi-ic24">' + ffiIcon('heart') + '</span>'
      + '<span class="ffi-ic24">' + ffiIcon('messenger') + '</span></span>'
      + '</div>';
    h += '<div class="ffi-stories">' + storyHtml('', true) + storyInps.map((inp) => storyHtml(inp.value, false)).join('') + '</div>';
    h += postHtml(p1, foto1);
    h += postHtml(p2, foto2);
    h += '<div class="ffi-tabbar">'
      + '<span class="ffi-tab"><span class="ffi-ic24">' + ffiIcon('homeFill') + '</span></span>'
      + '<span class="ffi-tab"><span class="ffi-ic24">' + ffiIcon('search') + '</span></span>'
      + '<span class="ffi-tab"><span class="ffi-ic24">' + ffiIcon('plus') + '</span></span>'
      + '<span class="ffi-tab"><span class="ffi-ic24">' + ffiIcon('reels') + '</span></span>'
      + '<span class="ffi-tab"><span class="ffi-tabava">' + FFI_PERSON + '</span></span>'
      + '</div>';

    T.show(preview, '<div class="ffi-dev"><div class="ffi-scr' + (dark ? ' dk' : '') + '">'
      + '<div class="ffi-sb">' + T.sysbar(isIPh ? 'iphone' : 'android', selBrand.value, dark) + '</div>'
      + '<div class="ffi-app' + (dark ? ' dk' : '') + '">' + h + '</div>'
      + (isIPh ? '<div class="ffi-home"></div>' : '<div class="ffi-anav"><i></i></div>')
      + '<div class="ffi-pranktag-wrap"><span class="ffi-pranktag">palsu · cuma prank</span></div>'
      + '</div></div>');
  }

  const semuaInput = [p1.user, p1.cap, p1.likes, p1.com, p1.time, p2.user, p2.cap, p2.likes, p2.com, p2.time, ...storyInps];
  semuaInput.forEach((elx) => elx.addEventListener('input', draw));
  [p1.ver, p1.like, p2.ver, p2.like, gradSel, grad2Sel, themeSel, selPlatform, selBrand].forEach((elx) => elx.addEventListener('change', draw));

  function contoh() {
    p1.user.value = 'adip.rmx'; p1.ver.value = 'ya'; p1.cap.value = 'Sunset hari ini 🌅 #senja';
    p1.likes.value = '1234'; p1.com.value = '48'; p1.time.value = '2 JAM YANG LALU'; p1.like.value = 'ya';
    p2.user.value = 'kopi.pagi'; p2.ver.value = 'tidak'; p2.cap.value = 'Ngopi dulu sebelum mulai kerja ☕';
    p2.likes.value = '856'; p2.com.value = '23'; p2.time.value = '5 JAM YANG LALU'; p2.like.value = 'tidak';
    storyInps[0].value = 'teman.satu'; storyInps[1].value = 'teman.dua';
    storyInps[2].value = 'teman.tiga'; storyInps[3].value = 'teman.empat';
    draw();
    T.scrollToPreview(preview);
    T.toast('Contoh dimuat');
  }

  const fiWrap = T.el('<div></div>');
  fiWrap.appendChild(fi);
  fiWrap.appendChild(delPhoto);

  const postFields = (p, judul) => {
    const grup = T.el('<div></div>');
    grup.appendChild(T.el('<div class="hint" style="margin:14px 0 4px;font-weight:600">' + judul + '</div>'));
    grup.appendChild(T.grid2(T.field('Username', p.user), T.field('Badge verified', p.ver)));
    grup.appendChild(T.field('Caption', p.cap));
    grup.appendChild(T.grid2(T.field('Jumlah likes', p.likes), T.field('Jumlah komentar', p.com)));
    grup.appendChild(T.grid2(T.field('Teks waktu', p.time), T.field('Tampilkan sebagai disukai', p.like)));
    return grup;
  };

  root.appendChild(T.el('<p class="note">🔒 ' + LOCAL_NOTE + '</p>'));
  root.appendChild(T.el('<div class="hint" style="margin:4px 0;font-weight:600">Baris story</div>'));
  root.appendChild(T.grid2(T.field('Story 1', storyInps[0]), T.field('Story 2', storyInps[1])));
  root.appendChild(T.grid2(T.field('Story 3', storyInps[2]), T.field('Story 4', storyInps[3])));
  root.appendChild(postFields(p1, 'Postingan pertama'));
  root.appendChild(postFields(p2, 'Postingan kedua'));
  root.appendChild(T.grid2(T.field('Upload foto postingan pertama', fiWrap), T.field('Atau pakai gradient', gradSel)));
  root.appendChild(T.field('Gradient postingan kedua', grad2Sel));
  root.appendChild(T.grid2(T.field('Tema', themeSel), T.field('Platform', selPlatform)));
  const brandField = T.field('Merk HP', selBrand);
  root.appendChild(brandField);
  root.appendChild(T.row(
    T.btn('🎲 Contoh', contoh),
    T.btn('⬇️ Unduh PNG', () => { dlNodePng(preview, 'fake-feed-ig.png'); }, true)
  ));
  root.appendChild(preview);
  draw();
}
