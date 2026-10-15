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

// Đọc / ghi object vào bộ nhớ trình duyệt (store = localStorage hoặc sessionStorage)
function load(store, key) {
  try { return JSON.parse(store.getItem(key)); } catch (e) { return null; }
}
function keep(store, key, value) {
  try { value == null ? store.removeItem(key) : store.setItem(key, JSON.stringify(value)); } catch (e) {}
}
