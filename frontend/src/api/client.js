import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("palantir_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("palantir_token");
      window.dispatchEvent(new Event("palantir:logout"));
    }
    return Promise.reject(err);
  }
);

export async function loginApi(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

export async function fetchClusterInfo() {
  const { data } = await api.get("/cluster/info");
  return data;
}

export async function fetchAddons() {
  const { data } = await api.get("/addons/");
  return data;
}

export async function fetchAddonAccess(addonName) {
  const { data } = await api.get(`/access/${addonName}`);
  return data;
}
