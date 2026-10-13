// Đăng nhập: nhận gmail, Node-RED kiểm tra đã đăng ký chưa rồi gửi PIN
const { askNodeRed, api, fail, cleanEmail, checkEmail } = require('./_mqtt');

module.exports = api(async (body) => {
  const email = cleanEmail(body.email);

  const err = checkEmail(email);
  if (err) return fail(err);

  return askNodeRed('login', { email });
});
