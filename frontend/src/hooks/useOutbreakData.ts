import { useState, useEffect } from 'react';

export interface OutbreakRecord {
  id: number;
  date: string;
  region: string;
  disease: string;
  cases_anonymized: number;
  deaths: number;
  recovered: number;
  population: number;
}

export interface OutbreakResponse {
  total: number;
  offset: number;
  limit: number;
  records: OutbreakRecord[];
}

export const useOutbreakData = () => {
  const [data, setData] = useState<OutbreakRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch first page to quickly show count, avoid loading all 7800 rows
        const response = await fetch('http://localhost:8000/api/data/outbreaks?limit=100&offset=0');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: OutbreakResponse = await response.json();
        setData(result.records);
        setTotal(result.total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { data, total, loading, error };
};
