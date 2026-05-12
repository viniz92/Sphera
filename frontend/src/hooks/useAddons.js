import { useState, useEffect } from "react";
import { fetchAddons, fetchAddonAccess } from "../api/client";

export function useAddons(clusterLoaded) {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clusterLoaded) return;
    load();
  }, [clusterLoaded]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAddons();
      // Para addons com UI, busca info de acesso em paralelo
      const withAccess = await Promise.all(
        data.map(async (addon) => {
          if (!addon.has_ui) return addon;
          try {
            const access = await fetchAddonAccess(addon.name);
            return { ...addon, access };
          } catch {
            return addon;
          }
        })
      );
      setAddons(withAccess);
    } catch (e) {
      setError(e.response?.data?.detail || "Erro ao listar addons.");
    } finally {
      setLoading(false);
    }
  }

  return { addons, loading, error, reload: load };
}
