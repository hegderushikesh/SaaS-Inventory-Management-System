import axiosClient from './axiosClient';

export const settingsApi = {
  /**
   * Get organization settings
   */
  async getSettings() {
    const response = await axiosClient.get('/settings');
    return response.data?.data;
  },

  /**
   * Update organization settings
   */
  async updateSettings(data) {
    const response = await axiosClient.put('/settings', data);
    return response.data?.data;
  }
};

export default settingsApi;
