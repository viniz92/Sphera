import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

export async function uploadKubeconfig(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/cluster/upload", form);
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
