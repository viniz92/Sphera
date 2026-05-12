import { useState, useEffect } from "react";
import { fetchClusterInfo } from "../api/client";

export function useCluster(enabled = true) {
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(!!enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetchClusterInfo()
      .then(setCluster)
      .catch(() => setError("Erro ao carregar cluster"))
      .finally(() => setLoading(false));
  }, [enabled]);

  async function refresh() {
    setLoading(true);
    try { setCluster(await fetchClusterInfo()); }
    catch { setError("Erro ao atualizar."); }
    finally { setLoading(false); }
  }

  return { cluster, loading, error, refresh };
}
