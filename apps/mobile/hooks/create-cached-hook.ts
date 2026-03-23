/**
 * Thin React wrapper around @broto/shared's createCachedStore.
 * Keeps React imports local to this app (avoids dual-React in monorepo).
 */
import { useEffect, useState } from 'react';
import { createCachedStore, type CachedStore } from '@broto/shared';

export interface CachedHookReturn<T> {
    data: T | null;
    loading: boolean;
    refresh: () => void;
}

export function createCachedHook<T>(fetcher: () => Promise<T>) {
    const store: CachedStore<T> = createCachedStore(fetcher);

    function useHook(): CachedHookReturn<T> {
        const [data, setData] = useState<T | null>(store.getCached());
        const [loading, setLoading] = useState(store.getCached() === null);

        useEffect(() => {
            const unsubscribe = store.subscribe(() => {
                setData(store.getCached());
                setLoading(false);
            });

            if (store.getCached() !== null) {
                setData(store.getCached());
                setLoading(false);
            } else {
                store.fetchData();
            }

            return unsubscribe;
        }, []);

        return { data, loading, refresh: store.refresh };
    }

    return { useHook, refresh: store.refresh, refreshIfStale: store.refreshIfStale };
}
