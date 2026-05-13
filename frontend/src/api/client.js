import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sphera_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sphera_token");
      window.dispatchEvent(new Event("sphera:logout"));
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

export async function fetchEvents() {
  const { data } = await api.get("/events/");
  return data;
}

export async function fetchNodeMetrics() {
  const { data } = await api.get("/metrics/nodes");
  return data;
}

export async function fetchPodMetrics() {
  const { data } = await api.get("/metrics/pods");
  return data;
}

export async function fetchCosts() {
  const { data } = await api.get("/costs/");
  return data;
}

export async function fetchPodDetail(namespace, name) {
  const { data } = await api.get(`/pods/${namespace}/${name}`);
  return data;
}

export async function fetchNodeCharts(hours = 1, step = 0) {
  const { data } = await api.get("/prometheus/nodes/charts", { params: { hours, step } });
  return data;
}
