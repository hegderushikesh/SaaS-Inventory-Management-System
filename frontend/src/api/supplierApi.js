import axiosClient from './axiosClient';

/**
 * Supplier API Client
 */
export const supplierApi = {
  /**
   * GET /api/suppliers
   */
  getSuppliers: async (params = {}) => {
    const response = await axiosClient.get('/suppliers', { params });
    return response.data;
  },

  /**
   * GET /api/suppliers/:id
   */
  getSupplierById: async (id) => {
    const response = await axiosClient.get(`/suppliers/${id}`);
    return response.data;
  },

  /**
   * POST /api/suppliers
   */
  createSupplier: async (data) => {
    const response = await axiosClient.post('/suppliers', data);
    return response.data;
  },

  /**
   * PUT /api/suppliers/:id
   */
  updateSupplier: async (id, data) => {
    const response = await axiosClient.put(`/suppliers/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /api/suppliers/:id
   */
  deleteSupplier: async (id) => {
    const response = await axiosClient.delete(`/suppliers/${id}`);
    return response.data;
  }
};

export default supplierApi;
