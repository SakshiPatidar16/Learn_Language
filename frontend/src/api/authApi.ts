import { API_BASE } from "../constants";

export async function loginApi({ email, password }) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
}

export async function signupApi({ name, email, phone, password }) {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Signup failed");
  return data;
}
