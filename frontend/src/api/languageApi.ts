import { API_BASE } from "../constants";

export async function getPublicLanguages() {
  const res = await fetch(`${API_BASE}/public/languages`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load languages");
  return data;
}

export async function getLanguages(token) {
  const res = await fetch(`${API_BASE}/languages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load languages");
  return data;
}

export async function createLanguage({ name, description }, token) {
  const res = await fetch(`${API_BASE}/languages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, description })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create language");
  return data;
}

export async function updateLanguage(id, { name, description }, token) {
  const res = await fetch(`${API_BASE}/languages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, description })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update language");
  return data;
}

export async function deleteLanguage(id, token) {
  const res = await fetch(`${API_BASE}/languages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete language");
  return data;
}
