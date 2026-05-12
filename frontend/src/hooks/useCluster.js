import { useState, useEffect, useCallback, useRef } from "react";
import { fetchMode, uploadKubeconfig, fetchClusterInfo } from "../api/client";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useCluster() {
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const modeRef = useRef(null);

  useEffect(() => {
    fetchMode()
      .then(({ mode }) => {
        setMode(mode);
        modeRef.current = mode;
        if (mode === "in-cluster") {
          return fetchClusterInfo().then((data) => {
            setCluster(data);
            setLastUpdated(new Date());
          });
        }
      })
      .catch(() => setMode("local"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mode || mode !== "in-cluster") return;
    const id = setInterval(() => {
      fetchClusterInfo()
        .then((data) => { setCluster(data); setLastUpdated(new Date()); })
        .catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [mode]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchClusterInfo();
      setCluster(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao atualizar.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  async function upload(file) {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadKubeconfig(file);
      setCluster(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao carregar o kubeconfig.");
    } finally {
      setLoading(false);
    }
  }

  return { cluster, loading, refreshing, error, mode, upload, refresh, lastUpdated };
}
