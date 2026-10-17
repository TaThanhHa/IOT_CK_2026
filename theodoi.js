// Nhận cập nhật tủ bằng "hỏi rồi chờ" — tách riêng khỏi giao diện (sau này đổi sang WebSocket chỉ sửa file này)
//   const td = theoDoi(hoi, nhan, loi)
//     hoi(biet)  → Promise trả {ban, ...}: gọi API "cho" kèm số phiên bản các tủ đang biết
//     nhan(out)  → trả true nếu còn cần theo dõi, false thì dừng
//     loi(err)   → báo lỗi (tự thử lại sau 2 giây)
//   td.batDau(biet)  bắt đầu / tiếp tục     td.dung()  dừng
// Trang bị ẩn (tắt màn hình, chuyển app) thì ngừng hỏi; hiện lại thì hỏi ngay.
function theoDoi(hoi, nhan, loi) {
  let biet = {};
  let dangChay = false;
  let dung = true;

  async function vong() {
    if (dangChay || dung) return;
    dangChay = true;
    while (!dung && document.visibilityState === 'visible') {
      try {
        const out = await hoi(biet);
        if (out.ban) biet = out.ban;
        if (!nhan(out)) dung = true;
      } catch (err) {
        if (loi) loi(err);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    dangChay = false;
  }

  document.addEventListener('visibilitychange', vong);
  return {
    batDau(b) { if (b) biet = b; dung = false; vong(); },
    dung() { dung = true; }
  };
}
