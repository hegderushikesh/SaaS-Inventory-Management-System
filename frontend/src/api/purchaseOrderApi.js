import axiosClient from './axiosClient';

/**
 * Purchase Order API Client
 */
export const purchaseOrderApi = {
  /**
   * GET /api/purchase-orders
   */
  getPurchaseOrders: async (params = {}) => {
    const response = await axiosClient.get('/purchase-orders', { params });
    return response.data;
  },

  /**
   * GET /api/purchase-orders/:id
   */
  getPurchaseOrderById: async (id) => {
    const response = await axiosClient.get(`/purchase-orders/${id}`);
    return response.data;
  },

  /**
   * POST /api/purchase-orders
   */
  createPurchaseOrder: async (data) => {
    const response = await axiosClient.post('/purchase-orders', data);
    return response.data;
  }
};

export default purchaseOrderApi;
