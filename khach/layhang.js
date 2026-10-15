// Khung lấy hàng cho 1 đơn: [Mở tủ] → các ô tủ đang mở → [Xác nhận đã lấy]
// Dùng chung cho lay.html (link trong mail) và trangchu.html (đã đăng nhập)
//   veDon(box, don, token, onXong)  don = {ve, thoiGian, dangLay, tu: [{id, cua}]}
const TT_TU = {
  mo:     ['🔓', 'Đang mở'],
  dong:   ['✅', 'Đã đóng'],
  con_do: ['📦', 'Còn đồ']
};

function taoEl(tag, cls, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
}

function veDon(box, don, token, onXong) {
  const goi = (action, data) => post('/api/lay', Object.assign({ action, ve: don.ve, token }, data));
  const dsTu = don.tu.map((t) => t.id).join(', ');

  box.innerHTML = '';
  const info = taoEl('div', 'don-info', `<b>Tủ ${dsTu}</b><span>Gửi lúc ${don.thoiGian}</span>`);
  const tiles = taoEl('div', 'tiles hidden');
  const hint = taoEl('p', 'note hidden');
  const btn = taoEl('button');
  const sau = taoEl('button', 'link hidden');
  const msgEl = taoEl('div', 'msg');
  btn.type = sau.type = 'button';
  sau.textContent = 'Để lại sau';
  [info, tiles, hint, btn, sau, msgEl].forEach((e) => box.appendChild(e));

  let buoc = 'mo';   // 'mo' = chưa mở, 'xacnhan' = đang mở, chờ xác nhận

  // list = [{id, cua}], nhay = tủ cần nhắc đóng
  function veTu(list, nhay) {
    tiles.innerHTML = '';
    tiles.classList.remove('hidden');
    list.forEach((t) => {
      const el = taoEl('div', 'tile ' + t.cua + ((nhay || []).includes(t.id) ? ' can-dong' : ''),
        `<b>Tủ ${t.id}</b><span class="icon">${TT_TU[t.cua][0]}</span><span class="st">${TT_TU[t.cua][1]}</span>`);
      if (t.cua === 'con_do') {
        const b = taoEl('button');
        b.type = 'button';
        b.textContent = 'Mở lại';
        b.onclick = () => run(b, msgEl, `Đang mở lại tủ ${t.id}...`, async () => {
          const out = await goi('mo', { tu: t.id });
          dangMo(out.tu);
        });
        el.appendChild(b);
      }
      tiles.appendChild(el);
    });
  }

  function chuaMo() {
    buoc = 'mo';
    btn.textContent = 'Mở tủ';
    btn.classList.remove('hidden');
    hint.textContent = 'Hãy đứng trước tủ rồi bấm Mở tủ.';
    hint.classList.remove('hidden');
  }

  function dangMo(list) {
    buoc = 'xacnhan';
    veTu(list);
    btn.textContent = 'Xác nhận đã lấy';
    btn.classList.remove('hidden');
    sau.classList.add('hidden');
    hint.textContent = 'Lấy hàng xong, đóng hết cửa rồi bấm Xác nhận.';
    hint.classList.remove('hidden');
    show(msgEl, list.length ? `Đã mở tủ ${list.map((t) => t.id).join(', ')}` : '', 'ok');
  }

  btn.onclick = () => {
    if (buoc === 'mo') {
      run(btn, msgEl, 'Đang mở tủ...', async () => {
        const out = await goi('mo');
        dangMo(out.tu);
      });
      return;
    }
    run(btn, msgEl, 'Đang kiểm tra cửa tủ...', async () => {
      const out = await goi('xacnhan');
      if (!out.xong) {
        veTu(out.tu, out.chuaDong);
        show(msgEl, `Tủ ${out.chuaDong.join(', ')} chưa đóng. Hãy đóng cửa rồi bấm Xác nhận lại.`, 'err');
        return;
      }
      if (!out.conDo.length) {
        box.innerHTML = '';
        box.appendChild(taoEl('div', 'xong', `✅ Đã lấy xong hàng ở tủ ${out.daLay.join(', ')}. Cảm ơn bạn!`));
        if (onXong) onXong();
        return;
      }
      // Còn đồ: cho mở lại hoặc để lại sau
      veTu(out.daLay.map((id) => ({ id, cua: 'dong' })).concat(out.conDo.map((id) => ({ id, cua: 'con_do' }))));
      hint.textContent = `Tủ ${out.conDo.join(', ')} vẫn còn đồ. Bấm "Mở lại" nếu bạn quên lấy.`;
      btn.classList.add('hidden');
      sau.classList.remove('hidden');
      show(msgEl, '');
    });
  };

  sau.onclick = () => {
    box.innerHTML = '';
    box.appendChild(taoEl('div', 'xong', '📦 Đơn vẫn chờ trong tủ, bạn có thể lấy sau.'));
    if (onXong) onXong();
  };

  // Đang lấy dở (tải lại trang) thì vào thẳng bước xác nhận
  if (don.dangLay) {
    dangMo(don.tu);
    show(msgEl, 'Bạn đang lấy dở đơn này', 'ok');
  } else {
    chuaMo();
  }
}
