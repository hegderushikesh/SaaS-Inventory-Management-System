import axiosClient from './axiosClient';

export const authApi = {
  /**
   * Register a new user and organization
   * @param {Object} data { name, organizationName, email, password, confirmPassword }
   */
  async register(data) {
    const response = await axiosClient.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login user with email and password
   * @param {Object} data { email, password }
   */
  async login(data) {
    const response = await axiosClient.post('/auth/login', data);
    return response.data;
  },

  /**
   * Retrieve currently authenticated user and organization details
   */
  async getMe() {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  }
};

export default authApi;
