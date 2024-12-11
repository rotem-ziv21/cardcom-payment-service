const mongoose = require('mongoose');

const cardcomConfigSchema = new mongoose.Schema({
  locationId: {
    type: String,
    required: true,
    unique: true
  },
  terminalNumber: {
    type: String,
    required: true
  },
  apiName: {
    type: String,
    required: true
  },
  environment: {
    type: String,
    enum: ['test', 'production'],
    default: 'test'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
cardcomConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CardcomConfig = mongoose.model('CardcomConfig', cardcomConfigSchema);

class CardcomConfigService {
  static async getConfig(locationId) {
    const config = await CardcomConfig.findOne({ locationId });
    if (!config) {
      throw new Error('Cardcom configuration not found for this location');
    }
    return config;
  }

  static async setConfig(locationId, config) {
    const configData = new CardcomConfig({ locationId, ...config });
    await configData.save();
    return configData;
  }

  static async updateConfig(locationId, config) {
    const configData = await CardcomConfig.findOneAndUpdate({ locationId }, config, { new: true });
    return configData;
  }
}

module.exports = CardcomConfigService;
