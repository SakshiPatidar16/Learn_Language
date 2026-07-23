import { API_BASE } from "../constants";

export async function getProgramsByUnit(unitId) {
  const res = await fetch(`${API_BASE}/public/units/${unitId}/programs`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load programs");
  return data;
}

export async function createProgram(unitId, payload, token) {
  const res = await fetch(`${API_BASE}/units/${unitId}/programs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create program");
  return data;
}

export async function updateProgram(programId, payload, token) {
  const res = await fetch(`${API_BASE}/programs/${programId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update program");
  return data;
}

export async function deleteProgram(programId, token) {
  const res = await fetch(`${API_BASE}/programs/${programId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete program");
  return data;
}

export async function deleteAllPrograms(token) {
  const res = await fetch(`${API_BASE}/cleanup/programs`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to clear programs");
  return data;
}
