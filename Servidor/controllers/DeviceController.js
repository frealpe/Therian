const { Device } = require('../models');
const logger = require('../lib/logger');

class DeviceController {
    async getDevices(req, res) {
        try {
            const devices = await Device.find();
            
            // Formatear para el frontend: device_uid, mac_address, name, description, role, status
            const formattedDevices = devices.map(d => ({
                _id: d._id,
                device_uid: d.uid,
                mac_address: d.mac,
                name: d.name,
                description: d.role === 'master' ? 'Gateway ESP-NOW a MQTT' : 'Drone Slave ESP-NOW',
                role: d.role,
                status: d.status,
                isActive: d.isActive,
                is_active_network: d.status === 'online',
                rssi: d.rssi
            }));

            res.json(formattedDevices);
        } catch (error) {
            logger.error('[DeviceController] Error:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al obtener dispositivos' });
        }
    }
    
    // Crear dispositivo (registro manual para whitelisting)
    async createDevice(req, res) {
        try {
            const { device_uid, mac_address, name, role } = req.body;
            
            // Verificar si la MAC ya existe
            const existing = await Device.findOne({ mac: mac_address });
            if (existing) {
                return res.status(400).json({ ok: false, msg: 'Un dispositivo con esa MAC ya existe' });
            }

            const newDevice = new Device({
                uid: device_uid || undefined, // si no viene lo genera Mongoose
                mac: mac_address,
                name: name || mac_address,
                role: role || 'slave',
                status: 'offline'
            });
            await newDevice.save();
            res.json({ ok: true, data: newDevice });
        } catch (error) {
            logger.error('[DeviceController] Error:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al crear dispositivo' });
        }
    }
    
    // Actualizar nombre/rol y otras propiedades
    async updateDevice(req, res) {
        try {
            const { id } = req.params;
            const { name, role, mac_address, device_uid, description, isActive } = req.body;
            
            const payload = {};
            if (name !== undefined) payload.name = name;
            if (role !== undefined) payload.role = role;
            if (mac_address !== undefined) payload.mac = mac_address;
            if (device_uid !== undefined) payload.uid = device_uid;
            if (isActive !== undefined) payload.isActive = isActive;
            
            // Si la MAC cambia, verificar que no colisione
            if (mac_address) {
                const existing = await Device.findOne({ mac: mac_address, _id: { $ne: id } });
                if (existing) {
                    return res.status(400).json({ ok: false, msg: 'Otra placa ya usa esta dirección MAC' });
                }
            }

            const updated = await Device.findByIdAndUpdate(id, payload, { new: true });

            // Si es un Master y se está habilitando, deshabilitar Otros Masters
            if (updated && updated.role === 'master' && isActive === true) {
                await Device.updateMany(
                    { role: 'master', _id: { $ne: id } },
                    { isActive: false }
                );
                logger.info(`[DeviceController] Master ${updated.mac} habilitado. Otros masters deshabilitados.`);
            }

            res.json({ ok: true, data: updated });
        } catch (error) {
            logger.error('[DeviceController] Error:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al actualizar dispositivo' });
        }
    }
    
    // Eliminar dispositivo
    async deleteDevice(req, res) {
        try {
            const { id } = req.params;
            await Device.findByIdAndDelete(id);
            res.json({ ok: true, msg: 'Dispositivo eliminado' });
        } catch (error) {
            logger.error('[DeviceController] Error:', { error: error.message });
            res.status(500).json({ ok: false, msg: 'Error al eliminar dispositivo' });
        }
    }
}

module.exports = new DeviceController();
