// Shipper giao hàng vào tủ (không cần đăng nhập, chỉ cần SĐT khách)
// action: check | open | cho → Node-RED tab "shipper" qua topic MQTT_TOPIC_TU (tu/web), dạng "ship_<action>"
// Đóng cửa là chốt, không còn bước Xác nhận
const { askNodeRed, api, fail, isTu, cleanBiet, CHO_MS } = require('./_mqtt');

const isPhone = (s) => /^(0|\+84)[0-9]{9,10}$/.test(s);
const isMaLuot = (s) => /^[a-f0-9]{16}$/.test(s);
const ask = (action, data, timeout) => askNodeRed('ship_' + action, data, process.env.MQTT_TOPIC_TU, timeout);

module.exports = api(async (body) => {
  const action = String(body.action || '');
  const phone = String(body.phone || '').trim();
  const maLuot = body.maLuot ? String(body.maLuot) : '';
  const tu = body.tu ? String(body.tu) : '';

  switch (action) {
  case 'check':
    if (!isPhone(phone)) return fail('Số điện thoại không hợp lệ');
    return ask('check', { phone });

  case 'open':  // không có tu: mở tủ trống tiếp theo; có tu: mở lại tủ vừa giao
    if (!isPhone(phone)) return fail('Số điện thoại không hợp lệ');
    if (maLuot && !isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    if (tu && !isTu(tu)) return fail('Số tủ không hợp lệ');
    return ask('open', { phone, maLuot, tu });

  case 'cho':   // hỏi rồi chờ: trả lời khi tủ trong lượt đổi trạng thái
    if (!isMaLuot(maLuot)) return fail('Lượt giao không hợp lệ');
    return ask('cho', { maLuot, biet: cleanBiet(body.biet) }, CHO_MS);

  default:
    return fail('Yêu cầu không hợp lệ');
  }
});
