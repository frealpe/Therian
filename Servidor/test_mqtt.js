const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://192.168.20.17', {
    username: 'plcuser',
    password: 'plc'
});

client.on('connect', () => {
    console.log('Connected to MQTT broker with credentials');
    client.subscribe('#', (err) => {
        if (err) console.error('Subscription error:', err);
    });
});

client.on('message', (topic, message) => {
    console.log(`[${new Date().toISOString()}] TOPIC: ${topic}`);
    console.log(`PAYLOAD: ${message.toString()}`);
});
