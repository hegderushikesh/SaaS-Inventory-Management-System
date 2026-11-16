import axiosClient from './axiosClient';

export const productApi = {
  /**
   * Fetch products with pagination, search, and sorting
   */
  async getProducts(params = {}) {
    const response = await axiosClient.get('/products', { params });
    return response.data;
  },

  /**
   * Fetch single product details by ID
   */
  async getProductById(id) {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data?.data;
  },

  /**
   * Create a new product
   */
  async createProduct(data) {
    const response = await axiosClient.post('/products', data);
    return response.data?.data;
  },

  /**
   * Update product details
   */
  async updateProduct(id, data) {
    const response = await axiosClient.put(`/products/${id}`, data);
    return response.data?.data;
  },

  /**
   * Delete a product
   */
  async deleteProduct(id) {
    const response = await axiosClient.delete(`/products/${id}`);
    return response.data?.data;
  },

  /**
   * Adjust product stock level (INCREASE or DECREASE)
   */
  async adjustStock(id, data) {
    const response = await axiosClient.patch(`/products/${id}/stock`, data);
    return response.data;
  }
};

export default productApi;
