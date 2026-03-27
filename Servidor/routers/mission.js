// routers/mission.js — REST endpoints for GeoBoard_03 Mission Control

const express = require('express');
const router  = express.Router();
const missionService = require('../services/MissionControlService');
const { Device }     = require('../models');

// GET /api/mission/bases — List all stored home bases
router.get('/bases', async (req, res) => {
    try {
        const bases = await missionService.getHomeBases();
        res.json({ ok: true, data: bases });
    } catch (e) {
        res.status(500).json({ ok: false, msg: e.message });
    }
});

// POST /api/mission/bases — Set / update a drone's home base
// Body: { droneMac, droneId, x, y, z }
router.post('/bases', async (req, res) => {
    try {
        const { droneMac, droneId, x, y, z } = req.body;
        if (!droneMac) return res.status(400).json({ ok: false, msg: 'droneMac required' });
        const base = await missionService.setHomeBase(droneMac, droneId, x || 0, y || 1.5, z || 0);
        res.json({ ok: true, data: base });
    } catch (e) {
        res.status(500).json({ ok: false, msg: e.message });
    }
});

// POST /api/mission/start — Begin mission
// Body: { waypoints: [{x,y,z}], droneIds: [mac, ...] }
router.post('/start', async (req, res) => {
    try {
        const { waypoints, droneIds } = req.body;
        if (!waypoints || !droneIds || droneIds.length === 0) {
            return res.status(400).json({ ok: false, msg: 'waypoints and droneIds required' });
        }
        const result = await missionService.startMission(waypoints, droneIds);
        res.json(result);
    } catch (e) {
        res.status(500).json({ ok: false, msg: e.message });
    }
});

// POST /api/mission/stop — Emergency stop
router.post('/stop', (req, res) => {
    try {
        missionService.stopMission('api_request');
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, msg: e.message });
    }
});

// GET /api/mission/state — Current live state
router.get('/state', (req, res) => {
    res.json({ ok: true, data: missionService.getState() });
});

module.exports = router;
