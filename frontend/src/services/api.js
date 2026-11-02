import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getDatasetInfo = async () => {
  const response = await api.get('/dataset/info');
  return response.data;
};

export const getDatasetPreview = async (limit = 10) => {
  const response = await api.get(`/dataset/preview?limit=${limit}`);
  return response.data;
};

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/dataset/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAnalyticsOverview = async () => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

export const getChurnDistribution = async () => {
  const response = await api.get('/analytics/churn-distribution');
  return response.data;
};

export const getChurnFactors = async () => {
  const response = await api.get('/analytics/churn-factors');
  return response.data;
};

export const trainModels = async () => {
  const response = await api.post('/model/train');
  return response.data;
};

export const getModelMetrics = async () => {
  const response = await api.get('/model/metrics');
  return response.data;
};

export const getModelComparison = async () => {
  const response = await api.get('/model/comparison');
  return response.data;
};

export const predictSingle = async (customerData) => {
  const response = await api.post('/predict', customerData);
  return response.data;
};

export const predictBatch = async () => {
  const response = await api.post('/predict/batch');
  return response.data;
};

export const getPredictions = async (page = 1, perPage = 15, riskCategory = '', search = '') => {
  let url = `/predictions?page=${page}&per_page=${perPage}`;
  if (riskCategory && riskCategory !== 'All') {
    url += `&risk_category=${encodeURIComponent(riskCategory)}`;
  }
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getHighRiskCustomers = async (limit = 100, search = '', order = 'desc') => {
  let url = `/predictions/high-risk?limit=${limit}&order=${order}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  const response = await api.get(url);
  return response.data;
};

export default api;
