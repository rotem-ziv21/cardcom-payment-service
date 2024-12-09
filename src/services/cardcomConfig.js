const { db } = require('../config/firebase');

class CardcomConfigService {
  constructor() {
    this.collection = db.collection('cardcom_configs');
  }

  async getConfig(locationId) {
    try {
      const doc = await this.collection.doc(locationId).get();
      if (!doc.exists) {
        throw new Error(`No Cardcom configuration found for location ${locationId}`);
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error fetching Cardcom config for location ${locationId}:`, error);
      throw error;
    }
  }

  async saveConfig(locationId, configData) {
    try {
      // Add validation for required fields
      const requiredFields = ['terminalNumber', 'username', 'apiName'];
      for (const field of requiredFields) {
        if (!configData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Add timestamps
      const data = {
        ...configData,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await this.collection.doc(locationId).set(data, { merge: true });
      return { id: locationId, ...data };
    } catch (error) {
      console.error(`Error saving Cardcom config for location ${locationId}:`, error);
      throw error;
    }
  }

  async deleteConfig(locationId) {
    try {
      await this.collection.doc(locationId).delete();
    } catch (error) {
      console.error(`Error deleting Cardcom config for location ${locationId}:`, error);
      throw error;
    }
  }
}

module.exports = new CardcomConfigService();
