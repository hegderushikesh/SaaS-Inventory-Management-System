import axiosClient from './axiosClient';

export const dashboardApi = {
  /**
   * Fetch inventory summary metrics and low stock alert items
   */
  async getSummary() {
    const response = await axiosClient.get('/dashboard/summary');
    return response.data?.data;
  }
};

export default dashboardApi;
