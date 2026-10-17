// Hàm dùng chung cho các API.
// File bắt đầu bằng "_" nên Vercel không coi nó là 1 API.
const mqtt = require('mqtt');
const crypto = require('crypto');

// Gửi yêu cầu {action, ...data} lên topic (mặc định MQTT_TOPIC) rồi chờ Node-RED trả lời
async function askNodeRed(action, data, base = process.env.MQTT_TOPIC, timeoutMs = 10000) {
  if (!base) throw new Error('Chưa cài biến môi trường topic MQTT trên Vercel');
  const reply = `${base}/result/${crypto.randomBytes(8).toString('hex')}`;

  const client = await mqtt.connectAsync(`mqtts://${process.env.MQTT_HOST}:8883`, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    clientId: 'vercel_' + crypto.randomBytes(4).toString('hex'),
    connectTimeout: 8000
  });

  try {
    await client.subscribeAsync(reply, { qos: 1 });

    const answer = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Máy chủ (Node-RED) không phản hồi')),
        timeoutMs
      );
      client.on('message', (t, buf) => {
        if (t !== reply) return;
        clearTimeout(timer);
        try { resolve(JSON.parse(buf.toString())); }
        catch (e) { reject(new Error('Phản hồi không hợp lệ')); }
      });
    });

    await client.publishAsync(base, JSON.stringify({ ...data, action, reply }), { qos: 1 });
    return await answer;
  } finally {
    client.end(true);
  }
}

// Bọc 1 API: chỉ nhận POST, bắt lỗi, trả JSON.
// fn trả về {ok:true, ...} hoặc {ok:false, error}
function api(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Chỉ chấp nhận POST' });
    }
    try {
      const out = await fn(req.body || {});
      if (!out.ok) return res.status(400).json({ error: out.error || 'Lỗi' });
      return res.status(200).json(out);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
}

const fail = (error) => ({ ok: false, error });

function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Chỉ nhận địa chỉ @gmail.com
function checkEmail(email) {
  return /^[a-z0-9.+]+@gmail\.com$/.test(email) ? null : 'Chỉ chấp nhận địa chỉ @gmail.com';
}

function checkInfo(name, phone) {
  if (!name) return 'Vui lòng nhập họ tên';
  if (name.length > 100) return 'Họ tên quá dài';
  if (!/^(0|\+84)[0-9]{9,10}$/.test(phone)) return 'Số điện thoại không hợp lệ';
  return null;
}

function checkMatKhau(mk) {
  return typeof mk === 'string' && mk.length >= 6 && mk.length <= 100 ? null : 'Mật khẩu phải có từ 6 ký tự';
}

// Vé ghi nhớ đăng nhập (64 hex)
const isVe = (s) => /^[a-f0-9]{64}$/.test(s);
const isTu = (s) => /^[A-Z0-9]{1,8}-[0-9]{1,3}$/.test(s);

// "biet" = {mã tủ: số phiên bản} web đang biết, dùng cho hỏi rồi chờ
function cleanBiet(b) {
  const out = {};
  if (b && typeof b === 'object') {
    Object.keys(b).slice(0, 50).forEach((k) => { if (isTu(k) && Number.isInteger(b[k])) out[k] = b[k]; });
  }
  return out;
}

// Hỏi rồi chờ: Node-RED trả trong ~6,5 s, chờ tối đa 9 s cho vừa giới hạn 10 s của Vercel
const CHO_MS = 9000;

module.exports = { askNodeRed, api, fail, cleanEmail, checkEmail, checkInfo, checkMatKhau, isVe, isTu, cleanBiet, CHO_MS };
