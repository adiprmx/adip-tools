import { h as T, utils } from '../../core.js?v=6.7.0';

export const meta = {"id":"http-status","name":"HTTP Status Lookup","cat":"developer","icon":"🌐","desc":"Cari arti 35 kode status HTTP + contoh pemakaiannya.","keywords":"http,status code,api,developer,404,500"};

const CAT={'1xx':'1xx · Informasi','2xx':'2xx · Sukses','3xx':'3xx · Pengalihan','4xx':'4xx · Kesalahan Klien','5xx':'5xx · Kesalahan Server'};
const COLOR={'1xx':'#9ca3af','2xx':'#22c55e','3xx':'#60a5fa','4xx':'#f59e0b','5xx':'#ef4444'};
const DATA=[
 [100,'Continue','1xx','Server siap menerima body request — dipakai sebelum kirim data besar.'],
 [101,'Switching Protocols','1xx','Protokol diganti di tengah jalan, misalnya upgrade ke WebSocket.'],
 [200,'OK','2xx','Semua beres — response standar untuk GET/POST yang sukses.'],
 [201,'Created','2xx','Resource baru berhasil dibuat — dipakai setelah POST bikin data.'],
 [202,'Accepted','2xx','Request diterima tapi diproses belakangan (antrean/background job).'],
 [204,'No Content','2xx','Sukses tanpa body — cocok untuk DELETE atau update ringan.'],
 [206,'Partial Content','2xx','Sebagian konten dikirim — dipakai untuk resume download & streaming.'],
 [301,'Moved Permanently','3xx','URL pindah permanen — browser & SEO harus pakai alamat baru.'],
 [302,'Found','3xx','Pindah sementara — dipakai untuk redirect login sementara.'],
 [303,'See Other','3xx','Lihat URL lain — dipakai setelah POST agar browser GET ulang.'],
 [304,'Not Modified','3xx','Konten tidak berubah — browser boleh pakai cache-nya.'],
 [307,'Temporary Redirect','3xx','Redirect sementara tapi method & body request dipertahankan.'],
 [308,'Permanent Redirect','3xx','Redirect permanen tapi method & body request dipertahankan.'],
 [400,'Bad Request','4xx','Request-nya ngaco — parameter atau formatnya tidak valid.'],
 [401,'Unauthorized','4xx','Belum login / token hilang — suruh autentikasi dulu.'],
 [402,'Payment Required','4xx','Butuh bayar dulu — dipakai untuk paywall & API berbayar.'],
 [403,'Forbidden','4xx','Sudah login tapi tidak punya izin akses resource ini.'],
 [404,'Not Found','4xx','Tidak ketemu — URL salah atau datanya sudah dihapus.'],
 [405,'Method Not Allowed','4xx','Method salah — misalnya POST ke endpoint yang cuma terima GET.'],
 [408,'Request Timeout','4xx','Client kelamaan — server menutup koneksi yang idle.'],
 [409,'Conflict','4xx','Bentrok — misalnya daftar dengan email yang sudah dipakai.'],
 [410,'Gone','4xx','Sudah dihapus permanen — beda dengan 404 yang bisa sementara.'],
 [413,'Content Too Large','4xx','Payload kebesaran — misalnya upload file melebihi batas.'],
 [415,'Unsupported Media Type','4xx','Format file tidak didukung — misalnya kirim .exe ke API gambar.'],
 [418,"I'm a Teapot",'4xx','Easter egg dari RFC 2324 — server menolak menyeduh kopi. ☕'],
 [422,'Unprocessable Content','4xx','Format benar tapi isinya gagal divalidasi — dipakai form & API modern.'],
 [425,'Too Early','4xx','Request datang terlalu cepat — dipakai untuk anti replay attack.'],
 [429,'Too Many Requests','4xx','Kena rate limit — suruh client pelan-pelan atau retry nanti.'],
 [451,'Unavailable For Legal Reasons','4xx','Diblokir karena alasan hukum — misalnya konten disensor.'],
 [500,'Internal Server Error','5xx','Server error misterius — cek log, jangan tunjukkan detail ke user.'],
 [501,'Not Implemented','5xx','Fitur belum diimplementasikan oleh server.'],
 [502,'Bad Gateway','5xx','Gateway/proxy dapat response ngaco dari server di belakangnya.'],
 [503,'Service Unavailable','5xx','Server down atau overload — biasanya sementara, coba lagi nanti.'],
 [504,'Gateway Timeout','5xx','Server di belakang gateway kelamaan merespons.'],
 [511,'Network Authentication Required','5xx','Harus login ke jaringan dulu — khas WiFi captive portal.'],
];

export function render(root){
  const q=T.input('text','Ketik kode atau nama, mis. 404 atau "not found"…');
  const countLbl=T.el('<div class="hint" style="margin:8px 0"></div>');
  const box=T.out();

  const item=([code,name,cat,desc])=>
    '<div style="border:1px solid #2b251d;border-radius:10px;padding:10px 12px;margin-bottom:8px;background:#14110d">'+
    '<div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap">'+
    '<b style="font-size:18px;color:'+COLOR[cat]+'">'+code+'</b>'+
    '<b>'+T.esc(name)+'</b>'+
    '<span class="mut" style="font-size:12px">'+T.esc(CAT[cat])+'</span></div>'+
    '<div class="mut" style="font-size:13px;margin-top:4px;line-height:1.5">'+T.esc(desc)+'</div></div>';

  const cari=()=>{
    const s=q.value.trim().toLowerCase();
    const hasil=!s?DATA:DATA.filter(([c,n,,d])=>String(c).includes(s)||n.toLowerCase().includes(s)||d.toLowerCase().includes(s));
    countLbl.textContent='Menampilkan '+hasil.length+' dari '+DATA.length+' kode';
    if(!hasil.length){T.show(box,'<p class="center mut">Nggak ketemu. Coba kata kunci lain.</p>');return;}
    T.show(box,hasil.map(item).join(''));
  };
  q.addEventListener('input',cari);
  T.onLeave(()=>q.removeEventListener('input',cari));

  root.appendChild(T.field('Cari kode status',q));
  root.appendChild(countLbl);
  root.appendChild(box);
  cari();
}
