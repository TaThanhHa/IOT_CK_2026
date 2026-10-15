// Khách lấy hàng: bằng vé trong link mail (ve) hoặc sau khi đăng nhập (token)
// action: xem | ds | mo | xacnhan → gửi sang Node-RED tab "khách hàng" qua MQTT_TOPIC_TU, dạng "khach_<action>"
const { askNodeRed, api, fail } = require('./_mqtt');

const isHex32 = (s) => /^[a-f0-9]{32}$/.test(s);
const ask = (action, data) => askNodeRed('khach_' + action, data, process.env.MQTT_TOPIC_TU);

module.exports = api(async (body) => {
  const action = String(body.action || '');
  const ve = String(body.ve || '');
  const token = body.token ? String(body.token) : '';
  const tu = body.tu == null ? null : Number(body.tu);

  if (token && !isHex32(token)) return fail('Phiên đăng nhập không hợp lệ, hãy đăng nhập lại');

  switch (action) {
  case 'ds':   // mọi đơn của tài khoản (cần đăng nhập)
    if (!token) return fail('Cần đăng nhập');
    return ask('ds', { token });

  case 'xem':
  case 'xacnhan':
    if (!isHex32(ve)) return fail('Link lấy hàng không hợp lệ');
    return ask(action, { ve, token });

  case 'mo':   // không có tu: mở mọi tủ của đơn; có tu: mở lại 1 tủ còn đồ
    if (!isHex32(ve)) return fail('Link lấy hàng không hợp lệ');
    if (tu !== null && !(Number.isInteger(tu) && tu > 0)) return fail('Số tủ không hợp lệ');
    return ask('mo', { ve, token, tu });

  default:
    return fail('Yêu cầu không hợp lệ');
  }
});
