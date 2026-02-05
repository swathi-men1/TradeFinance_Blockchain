/* Author: Abdul Samad | */
import { useState, useCallback } from 'react';

interface SafeFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    execute: (fetcher: () => Promise<any>) => Promise<void>;
}

export const useSafeFetch = <T>(): SafeFetchResult<T> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (fetcher: () => Promise<any>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetcher();
            // Handle both axios response object AND direct data return
            const result = response.data ? response.data : response;
            setData(result);
        } catch (err: any) {
            console.error("SafeFetch Error:", err);
            const detail = err.response?.data?.detail;
            let message: string;
            if (typeof detail === 'string') {
                message = detail;
            } else if (Array.isArray(detail)) {
                // FastAPI validation errors return an array
                message = detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
            } else if (detail && typeof detail === 'object') {
                message = detail.msg || JSON.stringify(detail);
            } else {
                message = err.message || "An unexpected error occurred";
            }
            setError(message);
            setData(null); // Reset data on error to prevent stale states
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, execute };
};
