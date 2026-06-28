const BASE = "/api";

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

  runTests: async (
    url,
    suites,
    username,
    password,
    documentFile
  ) => {
    const formData = new FormData();

    formData.append("url", url);

    formData.append(
      "suites",
      JSON.stringify(suites)
    );

    formData.append(
      "username",
      username || ""
    );

    formData.append(
      "password",
      password || ""
    );

    if (documentFile) {
      formData.append(
        "document",
        documentFile
      );
    }

    const res = await fetch(
      `${BASE}/tests/run`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const body = await res
        .json()
        .catch(() => ({}));

      throw new Error(
        body.error ||
        `Request failed: ${res.status}`
      );
    }

    return res.json();
  },

  getRun: (id) =>
    request(`/tests/${id}`),

  getHistory: () =>
    request("/history"),

  compareRuns: (run1, run2) =>
    request(
      `/tests/compare?run1=${run1}&run2=${run2}`
    ),

  deleteRun: (id) =>
    request(`/history/${id}`, {
      method: "DELETE",
    }),
};