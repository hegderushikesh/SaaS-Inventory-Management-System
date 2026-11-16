import axiosClient from './axiosClient';

/**
 * Stock Movement API Client
 */
export const stockMovementApi = {
  /**
   * GET /api/stock-movements
   * Retrieve paginated stock movements with optional filters
   */
  getMovements: async (params = {}) => {
    const response = await axiosClient.get('/stock-movements', { params });
    return response.data;
  },

  /**
   * GET /api/stock-movements/:id
   * Retrieve single stock movement by ID
   */
  getMovementById: async (id) => {
    const response = await axiosClient.get(`/stock-movements/${id}`);
    return response.data;
  },

  /**
   * GET /api/stock-movements/product/:productId
   * Retrieve stock movements for a specific product
   */
  getProductMovements: async (productId, params = {}) => {
    const response = await axiosClient.get(`/stock-movements/product/${productId}`, { params });
    return response.data;
  },

  /**
   * POST /api/stock-movements
   * Record a new stock movement and adjust inventory atomically
   */
  recordMovement: async (data) => {
    const response = await axiosClient.post('/stock-movements', data);
    return response.data;
  }
};

export default stockMovementApi;
