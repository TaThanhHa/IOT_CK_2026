// Khách lấy hàng (đã đăng nhập, kèm vé ghi nhớ đăng nhập)
// action: ds | mo | cho → Node-RED tab "khách hàng" qua MQTT_TOPIC_TU, dạng "khach_<action>"
// Đóng cửa là xong, không còn bước Xác nhận đã lấy
const { askNodeRed, api, fail, isVe, isTu, cleanBiet, CHO_MS } = require('./_mqtt');

const ask = (action, data, timeout) => askNodeRed('khach_' + action, data, process.env.MQTT_TOPIC_TU, timeout);

module.exports = api(async (body) => {
  const action = String(body.action || '');
  const ve = String(body.ve || '');
  if (!isVe(ve)) return fail('Phiên đăng nhập đã hết hạn, hãy đăng nhập lại');

  switch (action) {
  case 'ds':    // các tủ hàng chờ lấy
    return ask('ds', { ve });

  case 'mo': {  // tu: mở 1 tủ | tatCa: mở mọi tủ của mình
    const tu = body.tu ? String(body.tu) : '';
    if (!body.tatCa && !isTu(tu)) return fail('Số tủ không hợp lệ');
    return ask('mo', { ve, tu, tatCa: !!body.tatCa });
  }

  case 'cho':   // hỏi rồi chờ khi đang mở tủ
    return ask('cho', { ve, biet: cleanBiet(body.biet) }, CHO_MS);

  default:
    return fail('Yêu cầu không hợp lệ');
  }
});
