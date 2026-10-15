// Shipper giao hàng vào tủ (không cần đăng nhập, chỉ cần SĐT khách)
// action: check | open | confirm | status → gửi sang Node-RED tab "Tủ thông minh"
// qua topic MQTT_TOPIC_TU (tu/web), dạng "ship_<action>"
const { askNodeRed, api, fail } = require('./_mqtt');

const isPhone = (s) => /^(0|\+84)[0-9]{9,10}$/.test(s);
const isMaLuot = (s) => /^[a-f0-9]{16}$/.test(s);
const ask = (action, data) => askNodeRed('ship_' + action, data, process.env.MQTT_TOPIC_TU);

module.exports = api(async (body) => {
  const action = String(body.action || '');
  const phone = String(body.phone || '').trim();
  const maLuot = body.maLuot ? String(body.maLuot) : '';
  const tu = body.tu == null ? null : Number(body.tu);

  switch (action) {
  case 'check':
    if (!isPhone(phone)) return fail('Số điện thoại không hợp lệ');
    return ask('check', { phone });

  case 'open':  // không có tu: mở tủ trống tiếp theo; có tu: mở lại tủ đó
    if (!isPhone(phone)) return fail('Số điện thoại không hợp lệ');
    if (maLuot && !isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    if (tu !== null && !(Number.isInteger(tu) && tu > 0)) return fail('Số tủ không hợp lệ');
    return ask('open', { phone, maLuot, tu });

  case 'confirm':
  case 'status':  // status chỉ dùng khi tải lại trang giữa chừng
    if (!isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    return ask(action, { maLuot });

  default:
    return fail('Yêu cầu không hợp lệ');
  }
});
