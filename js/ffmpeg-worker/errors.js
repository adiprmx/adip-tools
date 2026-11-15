// Vendored dari @ffmpeg/ffmpeg@0.12.15 dist/esm/errors.js (https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/errors.js).
// Lisensi MIT (ffmpeg.wasm). Salinan persis dari CDN — JANGAN edit manual; ambil ulang dari CDN saat upgrade versi.
// Alasan di-vendor: file worker WAJIB same-origin (Worker lintas-origin ditolak Chrome; blob URL merusak import relatif ./const.js).
export const ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
export const ERROR_NOT_LOADED = new Error("ffmpeg is not loaded, call `await ffmpeg.load()` first");
export const ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
export const ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");
