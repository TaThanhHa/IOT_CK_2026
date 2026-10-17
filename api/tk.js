// Tài khoản: Gmail + mật khẩu, PIN qua Gmail chỉ khi đăng ký / quên mật khẩu, vé ghi nhớ đăng nhập
// action: dang_ky | quen | xac_minh | dang_nhap | vao | dang_xuat | dang_xuat_het | sua
// → Node-RED tab "Tài khoản" qua MQTT_TOPIC
const { askNodeRed, api, fail, cleanEmail, checkEmail, checkInfo, checkMatKhau, isVe } = require('./_mqtt');

module.exports = api(async (body) => {
  const action = String(body.action || '');
  const email = cleanEmail(body.email);
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const matKhau = typeof body.matKhau === 'string' ? body.matKhau : '';
  const ve = String(body.ve || '');
  let err;

  switch (action) {
  case 'dang_ky':
    err = checkInfo(name, phone) || checkEmail(email) || checkMatKhau(matKhau);
    if (err) return fail(err);
    return askNodeRed('dang_ky', { name, email, phone, matKhau });

  case 'quen':   // matKhau = mật khẩu mới, đổi khi nhập đúng PIN
    err = checkEmail(email) || checkMatKhau(matKhau);
    if (err) return fail(err);
    return askNodeRed('quen', { email, matKhau });

  case 'xac_minh': {
    const pin = String(body.pin || '').trim();
    if (checkEmail(email)) return fail('Gmail không hợp lệ');
    if (!/^[0-9]{6}$/.test(pin)) return fail('Mã PIN phải gồm 6 chữ số');
    return askNodeRed('xac_minh', { email, pin });
  }

  case 'dang_nhap':
    if (checkEmail(email)) return fail('Gmail không hợp lệ');
    if (!matKhau) return fail('Vui lòng nhập mật khẩu');
    return askNodeRed('dang_nhap', { email, matKhau });

  case 'vao':
  case 'dang_xuat':
  case 'dang_xuat_het':
    if (!isVe(ve)) return fail('Phiên đăng nhập đã hết hạn, hãy đăng nhập lại');
    return askNodeRed(action, { ve });

  case 'sua': {
    const matKhauMoi = typeof body.matKhauMoi === 'string' ? body.matKhauMoi : '';
    if (!isVe(ve)) return fail('Phiên đăng nhập đã hết hạn, hãy đăng nhập lại');
    err = checkInfo(name, phone) || (matKhau ? null : 'Vui lòng nhập mật khẩu hiện tại')
      || (matKhauMoi ? checkMatKhau(matKhauMoi) : null);
    if (err) return fail(err);
    return askNodeRed('sua', { ve, name, phone, matKhau, matKhauMoi });
  }

  default:
    return fail('Yêu cầu không hợp lệ');
  }
});
