import { useState, useEffect } from "react";
import type { DevnetProofRecord, ProofSummary } from "../lib/types";
import { loadDevnetProofs } from "../lib/data";
import { computeSummary } from "../lib/normalizeProofs";

interface UseDevnetProofsResult {
  records: DevnetProofRecord[];
  summary: ProofSummary;
  loading: boolean;
  error: string | null;
}

export function useDevnetProofs(): UseDevnetProofsResult {
  const [records, setRecords] = useState<DevnetProofRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevnetProofs()
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  const summary = computeSummary(records);
  return { records, summary, loading, error };
}
