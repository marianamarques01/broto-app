/**
 * Generic factory for module-level cached data hooks.
 * Deduplicates the pattern used in use-pet, use-progress, use-user.
 */
import { useEffect, useState } from 'react';

interface CachedHookReturn<T> {
    data: T | null;
    loading: boolean;
    refresh: () => void;
}

interface CacheStore<T> {
    cached: T | null;
    inflight: Promise<T | null> | null;
    listeners: Set<() => void>;
}

export function createCachedHook<T>(fetcher: () => Promise<T>) {
    const store: CacheStore<T> = {
        cached: null,
        inflight: null,
        listeners: new Set(),
    };

    function notifyListeners() {
        store.listeners.forEach(fn => fn());
    }

    function fetchData(): Promise<T | null> {
        if (store.inflight) return store.inflight;
        store.inflight = fetcher()
            .then(data => { store.cached = data; return data; })
            .catch(() => { store.cached = null; return null; })
            .finally(() => { store.inflight = null; notifyListeners(); });
        return store.inflight;
    }

    function refresh() {
        store.cached = null;
        fetchData();
    }

    function useHook(): CachedHookReturn<T> {
        const [data, setData] = useState<T | null>(store.cached);
        const [loading, setLoading] = useState(store.cached === null);

        useEffect(() => {
            const update = () => {
                setData(store.cached);
                setLoading(false);
            };
            store.listeners.add(update);

            if (store.cached !== null) {
                setData(store.cached);
                setLoading(false);
            } else {
                fetchData();
            }

            return () => { store.listeners.delete(update); };
        }, []);

        return { data, loading, refresh };
    }

    return { useHook, refresh };
}
