// Sửa tên/sđt sau khi đã đăng nhập (cần token do Node-RED cấp)
const { askNodeRed, api, fail, checkInfo } = require('./_mqtt');

module.exports = api(async (body) => {
  const token = String(body.token || '');
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();

  if (!/^[a-f0-9]{32}$/.test(token)) return fail('Phiên đăng nhập không hợp lệ, hãy đăng nhập lại');
  const err = checkInfo(name, phone);
  if (err) return fail(err);

  return askNodeRed('update', { token, name, phone });
});
