import { useState, useEffect } from "react";
import { fetchMode, uploadKubeconfig, fetchClusterInfo } from "../api/client";

export function useCluster() {
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    fetchMode()
      .then(({ mode }) => {
        setMode(mode);
        if (mode === "in-cluster") {
          return fetchClusterInfo().then(setCluster);
        }
      })
      .catch(() => setMode("local"))
      .finally(() => setLoading(false));
  }, []);

  async function upload(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadKubeconfig(file);
      setCluster(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao carregar o kubeconfig.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchClusterInfo();
      setCluster(data);
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao atualizar.");
    } finally {
      setLoading(false);
    }
  }

  return { cluster, loading, error, mode, upload, refresh };
}
