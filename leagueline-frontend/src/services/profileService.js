import api from './api';

export const profileService = {
  getProfile: async () => {
    const { data } = await api.get('/profile');
    return data;
  },

  updateProfile: async (payload) => {
    const { data } = await api.put('/profile', payload);
    return data;
  },

  changePassword: async (payload) => {
    const { data } = await api.put('/profile/password', payload);
    return data;
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  validateResetToken: async (token) => {
    const { data } = await api.get('/auth/reset-password/validate', {
      params: { token },
    });
    return data;
  },

  resetPassword: async (payload) => {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
  },
};