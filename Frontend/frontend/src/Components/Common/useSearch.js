import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const useSearch = (
    url,
    search = "",
    params = {},
    delay = 500
) => {
    const [data, setData] = useState({
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // AbortSignal ko parameter mein lenge
    const fetchData = useCallback(async (signal) => {
        if (!url) return;

        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");

            const response = await axios.get(url, {
                params: {
                    search: search.trim(),
                    ...params,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                signal: signal, // API request ko cancel karne ke liye
            });

            setData(response.data);
        } catch (err) {
            // Agar request intentionally cancel hui hai (e.g. typing), toh error ignore karein
            if (axios.isCancel(err)) {
                return;
            }

            console.error("useSearch Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    }, [url, search, JSON.stringify(params)]);

    useEffect(() => {
        // Naya AbortController banayein
        const controller = new AbortController();

        const timer = setTimeout(() => {
            fetchData(controller.signal);
        }, delay);

        // Cleanup function mein purani request cancel kar dein aur timer clear karein
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [fetchData, delay]);

    // Manual refetch ke liye (bina signal ke)
    const refetch = () => fetchData();

    return {
        data,
        loading,
        error,
        fetchData,
        refetch,
    };
};

export default useSearch;