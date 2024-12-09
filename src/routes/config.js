const express = require('express');
const router = express.Router();
const cardcomConfigService = require('../services/cardcomConfig');

// Get Cardcom configuration for a location
router.get('/:locationId/cardcom', async (req, res) => {
  try {
    const config = await cardcomConfigService.getConfig(req.params.locationId);
    res.json(config);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Save or update Cardcom configuration for a location
router.post('/:locationId/cardcom', async (req, res) => {
  try {
    const config = await cardcomConfigService.saveConfig(req.params.locationId, {
      terminalNumber: req.body.terminalNumber,
      username: req.body.username,
      apiName: req.body.apiName,
      environment: req.body.environment || 'test'
    });
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Cardcom configuration for a location
router.delete('/:locationId/cardcom', async (req, res) => {
  try {
    await cardcomConfigService.deleteConfig(req.params.locationId);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
