// Hàm dùng chung cho mọi trang
const $ = (id) => document.getElementById(id);

function show(el, text, cls) { el.className = 'msg ' + (cls || ''); el.textContent = text; }

// Gọi API trên Vercel, lỗi thì ném Error kèm câu báo
async function post(url, data) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    throw new Error('Không có mạng, hãy thử lại');
  }
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || 'Lỗi không xác định');
  return out;
}

// Khoá nút trong lúc chờ, hiện lỗi nếu có
async function run(btn, msgEl, text, fn) {
  btn.disabled = true;
  show(msgEl, text);
  try { await fn(); }
  catch (err) { show(msgEl, err.message, 'err'); }
  finally { btn.disabled = false; }
}

// Tên tủ để hiện: "A-2" → "Tủ 2" (trạm hiện ở dòng phụ nếu cần)
const tenTu = (id) => 'Tủ ' + String(id).split('-')[1];

// Đọc / ghi object vào bộ nhớ trình duyệt (store = localStorage hoặc sessionStorage)
function load(store, key) {
  try { return JSON.parse(store.getItem(key)); } catch (e) { return null; }
}
function keep(store, key, value) {
  try { value == null ? store.removeItem(key) : store.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// Mã thiết bị của shipper: chuỗi ngẫu nhiên tạo 1 lần, cất trong máy (lượt giao gắn với SĐT khách + máy này)
let _thietBi = null;
function thietBi() {
  if (_thietBi) return _thietBi;
  let tb = load(localStorage, 'thietBi');
  if (!tb) {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    tb = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    keep(localStorage, 'thietBi', tb);
  }
  return (_thietBi = tb);
}
