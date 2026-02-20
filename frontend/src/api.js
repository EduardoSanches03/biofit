const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const SESSION_KEY = "biofit_nutri_session";

function getSessionToken() {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.token || "";
  } catch {
    return "";
  }
}

async function request(path, options = {}, withAuth = true) {
  const token = withAuth ? getSessionToken() : "";
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Falha na requisicao.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }, false),
  getMe: () => request("/auth/me"),
  getSummary: () => request("/dashboard/summary"),
  getConsultationsByDate: (date) => request(`/consultations?date=${encodeURIComponent(date)}`),
  getLatestConsultation: (patientId) =>
    request(`/consultations/latest?patientId=${encodeURIComponent(patientId)}`),
  getConsultationsCalendar: (month) =>
    request(`/consultations/calendar?month=${encodeURIComponent(month)}`),
  createConsultation: (body) =>
    request("/consultations", { method: "POST", body: JSON.stringify(body) }),
  getPlans: (patientId = "") =>
    request(`/plans${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ""}`),
  savePlan: (patientId, body) =>
    request(`/plans/${encodeURIComponent(patientId)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getPhysicalAssessments: (patientId = "") =>
    request(
      `/physical-assessments${patientId ? `?patientId=${encodeURIComponent(patientId)}` : ""}`,
    ),
  getPhysicalAssessment: (id) => request(`/physical-assessments/${encodeURIComponent(id)}`),
  createPhysicalAssessment: (body) =>
    request("/physical-assessments", { method: "POST", body: JSON.stringify(body) }),
  updatePhysicalAssessment: (id, body) =>
    request(`/physical-assessments/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deletePhysicalAssessment: (id) =>
    request(`/physical-assessments/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getPatients: () => request("/patients"),
  createPatient: (body) => request("/patients", { method: "POST", body: JSON.stringify(body) }),
  updatePatient: (id, body) =>
    request(`/patients/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: "DELETE" }),
  getFoods: () => request("/foods"),
  createFood: (body) => request("/foods", { method: "POST", body: JSON.stringify(body) }),
  updateFood: (id, body) => request(`/foods/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteFood: (id) => request(`/foods/${id}`, { method: "DELETE" }),
};
