// Shipper giao hàng vào tủ (không cần đăng nhập, chỉ cần SĐT khách)
// action: check | open | cho | huy | xong → Node-RED tab "shipper" qua topic MQTT_TOPIC_TU (tu/web), dạng "ship_<action>"
// Lượt giao theo SĐT khách + mã thiết bị (chuỗi ngẫu nhiên trình duyệt shipper tự tạo)
const { askNodeRed, api, fail, isTu, cleanBiet, CHO_MS } = require('./_mqtt');

const isPhone = (s) => /^(0|\+84)[0-9]{9,10}$/.test(s);
const isMaLuot = (s) => /^[a-f0-9]{16}$/.test(s);
const isThietBi = (s) => /^[a-f0-9]{32}$/.test(s);
const ask = (action, data, timeout) => askNodeRed('ship_' + action, data, process.env.MQTT_TOPIC_TU, timeout);

module.exports = api(async (body) => {
  const action = String(body.action || '');
  const phone = String(body.phone || '').trim();
  const maLuot = body.maLuot ? String(body.maLuot) : '';
  const tu = body.tu ? String(body.tu) : '';
  const thietBi = String(body.thietBi || '');
  if (!isThietBi(thietBi)) return fail('Thiết bị không hợp lệ, hãy tải lại trang');

  switch (action) {
  case 'check':
    if (!isPhone(phone)) return fail('Số điện thoại không hợp lệ');
    return ask('check', { phone, thietBi });

  case 'open':  // không có tu: mở tủ trống tiếp theo; có tu: mở lại tủ đã đóng trong lượt
    if (!isPhone(phone)) return fail('Số điện thoại không hợp lệ');
    if (maLuot && !isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    if (tu && !isTu(tu)) return fail('Số tủ không hợp lệ');
    return ask('open', { phone, maLuot, tu, thietBi });

  case 'cho':   // hỏi rồi chờ: trả lời khi tủ trong lượt / lượt đổi
    if (!isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    return ask('cho', { maLuot, thietBi, biet: cleanBiet(body.biet) }, CHO_MS);

  case 'huy':   // ✕ trên ô tủ
    if (!isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    if (!isTu(tu)) return fail('Số tủ không hợp lệ');
    return ask('huy', { maLuot, thietBi, tu });

  case 'xong':  // Giao đơn khác: còn tủ mở thì không cho
    if (!isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    return ask('xong', { maLuot, thietBi });

  default:
    return fail('Yêu cầu không hợp lệ');
  }
});
