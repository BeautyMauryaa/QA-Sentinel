const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));

    throw new Error(
      body.error ||
      `Request failed: ${res.status}`
    );
  }
  return res.json();
}

export const api = {
  getSuites: () => request("/suites"),

  // New method for Visual Regression
  runVisualTest: (payload) => 
    request("/visual-test", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  uploadBaseline: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${BASE}/upload-baseline`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    return res.json(); // { success: true, path: 'data/baselines/xxx.png' }
  },

  runTests: async (url, suites, username, password, documentFile) => {
    const formData = new FormData();
    formData.append("url", url);
    formData.append("suites", JSON.stringify(suites));
    formData.append("username", username || "");
    formData.append("password", password || "");
    if (documentFile) {
      formData.append("document", documentFile);
    }

    const res = await fetch(`${BASE}/tests/run`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  getRun: (id) => request(`/tests/${id}`),
  getHistory: () => request("/history"),
  compareRuns: (run1, run2) => request(`/tests/compare?run1=${run1}&run2=${run2}`),
  deleteRun: (id) => request(`/history/${id}`, { method: "DELETE" }),
};