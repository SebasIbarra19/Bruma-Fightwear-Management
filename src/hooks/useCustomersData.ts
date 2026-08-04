import { useEffect, useState } from 'react';
import type { Customer } from '@/lib/database/adapters/customers-adapter';

interface UseCustomersDataOptions {
  projectId: string;
}

interface UseCustomersDataResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

export function useCustomersData({ projectId }: UseCustomersDataOptions): UseCustomersDataResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError('No projectId provided');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/customers?projectId=${projectId}`)
      .then(res => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setCustomers(result.data);
        } else {
          setError(result.error || 'Error loading customers');
        }
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  return { customers, loading, error };
}
