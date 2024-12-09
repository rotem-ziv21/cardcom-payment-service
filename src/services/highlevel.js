const axios = require('axios');

class HighLevelService {
  constructor() {
    this.baseUrl = 'https://services.leadconnectorhq.com';
  }

  async createProviderIntegration(locationId, accessToken) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments/integrations/provider/whitelabel`,
        {
          altId: locationId,
          altType: 'location',
          uniqueName: process.env.PROVIDER_UNIQUE_NAME,
          title: process.env.PROVIDER_NAME,
          provider: 'nmi', // Using NMI as the provider type since Cardcom isn't listed
          description: process.env.PROVIDER_DESCRIPTION,
          imageUrl: process.env.PROVIDER_LOGO_URL
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': process.env.API_VERSION
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Provider integration creation error:', error);
      throw error;
    }
  }

  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        client_id: process.env.HIGHLEVEL_CLIENT_ID,
        client_secret: process.env.HIGHLEVEL_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      });
      
      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  async sendWebhookEvent(event, payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments/custom-provider/webhook`,
        {
          event,
          ...payload
        },
        {
          headers: {
            'Version': process.env.API_VERSION
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Webhook send error:', error);
      throw error;
    }
  }
}

module.exports = new HighLevelService();
