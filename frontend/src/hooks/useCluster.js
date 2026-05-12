import { useState, useEffect, useCallback } from "react";
import { fetchClusterInfo } from "../api/client";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useCluster(enabled = true) {
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(!!enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetchClusterInfo()
      .then(data => { setCluster(data); setLastUpdated(new Date()); })
      .catch(() => setError("Erro ao carregar cluster"))
      .finally(() => setLoading(false));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      fetchClusterInfo()
        .then(data => { setCluster(data); setLastUpdated(new Date()); })
        .catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchClusterInfo();
      setCluster(data);
      setLastUpdated(new Date());
    } catch {
      setError("Erro ao atualizar.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { cluster, loading, refreshing, error, refresh, lastUpdated };
}
