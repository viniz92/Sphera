import { useState, useEffect, useCallback } from "react";
import { fetchClusterInfo } from "../api/client";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const SEEN_KEY = "sphera_seen_next_versions";

function getSeenVersions() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
  catch { return new Set(); }
}

function markVersionSeen(v) {
  const seen = getSeenVersions();
  seen.add(v);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export function useCluster(enabled = true) {
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(!!enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newVersionNotif, setNewVersionNotif] = useState(null);

  function checkNewVersion(data) {
    const next = data.next_version;
    if (!next || next === data.version) return;
    if (!getSeenVersions().has(next)) {
      setNewVersionNotif({ version: next });
    }
  }

  function dismissNotif() {
    if (newVersionNotif) markVersionSeen(newVersionNotif.version);
    setNewVersionNotif(null);
  }

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetchClusterInfo()
      .then(data => { setCluster(data); setLastUpdated(new Date()); checkNewVersion(data); })
      .catch(() => setError("Erro ao carregar cluster"))
      .finally(() => setLoading(false));
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      fetchClusterInfo()
        .then(data => { setCluster(data); setLastUpdated(new Date()); checkNewVersion(data); })
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
      checkNewVersion(data);
    } catch {
      setError("Erro ao atualizar.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { cluster, loading, refreshing, error, refresh, lastUpdated, newVersionNotif, dismissNotif };
}
