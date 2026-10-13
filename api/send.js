// Bước 1: nhận tên/gmail/sđt, gửi lên Node-RED để tạo PIN và gửi mail
const { askNodeRed } = require('./_mqtt');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận POST' });
  }

  const { name, email, phone } = req.body || {};

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Thiếu thông tin' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Gmail không hợp lệ' });
  }
  if (!/^(0|\+84)[0-9]{9,10}$/.test(phone)) {
    return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
  }

  try {
    const result = await askNodeRed('', {
      name: String(name).trim().slice(0, 100),
      email: String(email).trim().toLowerCase().slice(0, 100),
      phone: String(phone),
      time: new Date().toISOString()
    });
    if (!result.ok) return res.status(400).json({ error: result.error || 'Lỗi' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
