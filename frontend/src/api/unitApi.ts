import { API_BASE } from "../constants";

export async function getUnitsByLanguage(languageId) {
  const res = await fetch(`${API_BASE}/public/languages/${languageId}/units`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load units");
  return data;
}

export async function createUnit(languageId, formData, token) {
  const res = await fetch(`${API_BASE}/languages/${languageId}/units`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create unit");
  return data;
}

export async function updateUnit(unitId, { name, notes }, token) {
  const res = await fetch(`${API_BASE}/units/${unitId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, notes })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update unit");
  return data;
}

export async function deleteUnit(unitId, token) {
  const res = await fetch(`${API_BASE}/units/${unitId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete unit");
  return data;
}

export async function uploadUnitFile(unitId, formData, token) {
  const res = await fetch(`${API_BASE}/units/${unitId}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to upload file");
  return data;
}

export async function removeUnitFile(unitId, fileId, token) {
  const res = await fetch(`${API_BASE}/units/${unitId}/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || "Failed to remove file");
  }
}
