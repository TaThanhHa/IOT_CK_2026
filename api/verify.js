// Kiểm tra mã PIN (dùng chung cho đăng ký và đăng nhập)
const { askNodeRed, api, fail, cleanEmail, checkEmail } = require('./_mqtt');

module.exports = api(async (body) => {
  const email = cleanEmail(body.email);
  const pin = String(body.pin || '').trim();

  if (checkEmail(email)) return fail('Gmail không hợp lệ');
  if (!/^[0-9]{6}$/.test(pin)) return fail('Mã PIN phải gồm 6 chữ số');

  // Node-RED trả về {ok, mode} và nếu là đăng nhập thì kèm {token, user}
  return askNodeRed('verify', { email, pin });
});
