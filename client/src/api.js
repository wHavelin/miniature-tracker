const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchMiniatures(filters = {}) {
  const params = new URLSearchParams();
  if (filters.game_system) params.set('game_system', filters.game_system);
  if (filters.faction) params.set('faction', filters.faction);
  if (filters.paint_status) params.set('paint_status', filters.paint_status);
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return request(`${BASE}/miniatures${qs ? `?${qs}` : ''}`);
}

export async function fetchStats() {
  return request(`${BASE}/stats`);
}

export async function fetchFilters() {
  return request(`${BASE}/filters`);
}

export async function createMiniature(formData) {
  return request(`${BASE}/miniatures`, {
    method: 'POST',
    body: formData
  });
}

export async function updateMiniature(id, formData) {
  return request(`${BASE}/miniatures/${id}`, {
    method: 'PUT',
    body: formData
  });
}

export async function deleteMiniature(id) {
  return request(`${BASE}/miniatures/${id}`, {
    method: 'DELETE'
  });
}

export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  return `/uploads/${imagePath}`;
}

export const PAINT_STATUSES = [
  { value: 'unassembled', label: 'Unassembled' },
  { value: 'assembled', label: 'Assembled' },
  { value: 'painted', label: 'Painted' }
];

export const STATUS_COLORS = {
  unassembled: { bg: '#9e9e9e', text: '#1a1a1a' }, // 6.4:1 ✓ AA
  assembled:   { bg: '#bdbdbd', text: '#1a1a1a' }, // 8.8:1 ✓ AAA
  painted:     { bg: '#166534', text: '#ffffff' }, // 6.5:1 ✓ AA
};

export function getStatusLabel(value) {
  const found = PAINT_STATUSES.find(s => s.value === value);
  return found ? found.label : value;
}
