// Vercel Serverless Function: nhận form từ index.html rồi publish lên EMQX
const mqtt = require('mqtt');

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

  const payload = JSON.stringify({
    name: String(name).slice(0, 100),
    email: String(email).slice(0, 100),
    phone: String(phone),
    time: new Date().toISOString()
  });

  let client;
  try {
    // Cấu hình lấy từ Environment Variables trên Vercel
    client = await mqtt.connectAsync(`mqtts://${process.env.MQTT_HOST}:8883`, {
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASS,
      clientId: 'vercel_' + Math.random().toString(16).slice(2, 10),
      connectTimeout: 8000
    });
    await client.publishAsync(process.env.MQTT_TOPIC, payload, { qos: 1 });
    await client.endAsync();
    return res.status(200).json({ ok: true });
  } catch (err) {
    if (client) client.end(true);
    return res.status(500).json({ error: 'Không gửi được tới MQTT: ' + err.message });
  }
};
