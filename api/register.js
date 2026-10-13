// Đăng ký: nhận tên/gmail/sđt, nhờ Node-RED gửi PIN về gmail
const { askNodeRed, api, fail, cleanEmail, checkEmail, checkInfo } = require('./_mqtt');

module.exports = api(async (body) => {
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = cleanEmail(body.email);

  const err = checkInfo(name, phone) || checkEmail(email);
  if (err) return fail(err);

  return askNodeRed('register', { name, email, phone });
});
