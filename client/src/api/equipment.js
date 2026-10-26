import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jixozmed_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================================================
// Оборудование
// ============================================================
export async function fetchEquipment(params = {}) {
  const { data } = await api.get('/equipment', { params });
  return data.equipment || [];
}

export async function fetchEquipmentById(id) {
  const { data } = await api.get(`/equipment/${id}`);
  return data.equipment;
}

export async function fetchEquipmentCounts() {
  const { data } = await api.get('/equipment/counts');
  return data.counts || {};
}

export async function fetchEquipmentByOrg(organizationId) {
  const { data } = await api.get('/equipment', {
    params: { organization_id: organizationId },
  });
  return data.equipment || [];
}

export async function createEquipment(payload) {
  const { data } = await api.post('/equipment', payload);
  return data;
}

export async function updateEquipment(id, payload) {
  const { data } = await api.put(`/equipment/${id}`, payload);
  return data;
}

export async function deleteEquipment(id) {
  const { data } = await api.delete(`/equipment/${id}`);
  return data;
}

// ============================================================
// Классификатор (автодополнение)
// ============================================================
export async function searchClassifier(q) {
  if (!q || q.length < 2) return [];
  const { data } = await api.get('/classifier/search', { params: { q } });
  return data.results || [];
}

export async function fetchClassifierSections() {
  const { data } = await api.get('/classifier/sections');
  return data.sections || [];
}

export async function searchModels(q) {
  if (!q || q.length < 2) return [];
  const { data } = await api.get('/classifier/models', { params: { q } });
  return data.results || [];
}

// ============================================================
// Организации (для выпадающего списка)
// ============================================================
export async function fetchOrganizations() {
  const { data } = await api.get('/organizations');
  return data.organizations || [];
}
