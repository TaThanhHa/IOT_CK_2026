// Bước 2: gửi gmail + mã PIN người dùng nhập lên Node-RED để kiểm tra
const { askNodeRed } = require('./_mqtt');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận POST' });
  }

  const { email, pin } = req.body || {};

  if (!email || !/^[0-9]{6}$/.test(String(pin))) {
    return res.status(400).json({ error: 'Mã PIN phải gồm 6 chữ số' });
  }

  try {
    const result = await askNodeRed('verify', {
      email: String(email).trim().toLowerCase().slice(0, 100),
      pin: String(pin)
    });
    if (!result.ok) return res.status(400).json({ error: result.error || 'Sai mã PIN' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
