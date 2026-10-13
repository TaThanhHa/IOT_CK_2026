// Hàm dùng chung: publish lên EMQX rồi chờ Node-RED trả lời.
// File bắt đầu bằng "_" nên Vercel không coi nó là 1 API.
const mqtt = require('mqtt');
const crypto = require('crypto');

async function askNodeRed(subTopic, data, timeoutMs = 10000) {
  const base = process.env.MQTT_TOPIC;
  const topic = subTopic ? `${base}/${subTopic}` : base;
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
        () => reject(new Error('Máy chủ xác thực (Node-RED) không phản hồi')),
        timeoutMs
      );
      client.on('message', (t, buf) => {
        if (t !== reply) return;
        clearTimeout(timer);
        try { resolve(JSON.parse(buf.toString())); }
        catch (e) { reject(new Error('Phản hồi không hợp lệ')); }
      });
    });

    await client.publishAsync(topic, JSON.stringify({ ...data, reply }), { qos: 1 });
    return await answer;
  } finally {
    client.end(true);
  }
}

module.exports = { askNodeRed };
