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

export const useOutbreakData = () => {
  const [data, setData] = useState<OutbreakRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/data/outbreaks');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
