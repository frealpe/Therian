const mongoose = require('mongoose');
const Device = require('./models/Device');
mongoose.connect('mongodb://localhost:27017/drone_fleet').then(async () => {
    try {
        const doc = await Device.findOneAndUpdate(
            { mac: 'test_mac' },
            { mac: 'test_mac', name: 'Test Master', role: 'master' },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log("SUCCESS:", doc);
    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
});
