const { db } = require('../config/firebase');
const axios = require('axios');

class TokenService {
  constructor() {
    this.collection = db.collection('oauth_tokens');
  }

  async getToken(locationId) {
    try {
      const doc = await this.collection.doc(locationId).get();
      if (!doc.exists) {
        throw new Error(`No token found for location ${locationId}`);
      }

      const tokenData = doc.data();
      
      // Check if token needs refresh
      const expiryTime = new Date(tokenData.updatedAt).getTime() + (tokenData.expiresIn * 1000);
      if (Date.now() >= expiryTime) {
        return await this.refreshToken(locationId, tokenData.refreshToken);
      }

      return tokenData;
    } catch (error) {
      console.error(`Error getting token for location ${locationId}:`, error);
      throw error;
    }
  }

  async refreshToken(locationId, refreshToken) {
    try {
      const response = await axios.post('https://services.gohighlevel.com/oauth/token', {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      });

      const tokenData = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type,
        updatedAt: new Date().toISOString()
      };

      await this.collection.doc(locationId).update(tokenData);
      return tokenData;
    } catch (error) {
      console.error(`Error refreshing token for location ${locationId}:`, error);
      throw error;
    }
  }

  async deleteToken(locationId) {
    try {
      await this.collection.doc(locationId).delete();
    } catch (error) {
      console.error(`Error deleting token for location ${locationId}:`, error);
      throw error;
    }
  }
}

module.exports = new TokenService();
