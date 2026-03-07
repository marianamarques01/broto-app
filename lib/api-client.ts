import { createClient } from '@/lib/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export class ApiError extends Error {
    status: number;
    body?: unknown;

    constructor(message: string, status: number, body?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

function pathToFunctionName(path: string): string {
    if (!path.startsWith('/api/')) return path;
    return path.replace(/^\/api\//, '').replace(/\//g, '-');
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

async function invoke<T>(
    path: string,
    options: {
        method?: HttpMethod;
        body?: Record<string, unknown>;
        params?: Record<string, string | number | undefined>;
    },
): Promise<T> {
    const fnName = pathToFunctionName(path);
    const supabase = createClient();

    const invokeOptions: { method?: HttpMethod; body?: Record<string, unknown> } = {};
    if (options.method) invokeOptions.method = options.method;
    if (options.body !== undefined) invokeOptions.body = options.body;

    if (options.params) {
        const search = new URLSearchParams();
        for (const [k, v] of Object.entries(options.params)) {
            if (v !== undefined && v !== '') search.set(k, String(v));
        }
        const query = search.toString();
        if (query) {
            invokeOptions.body = {
                ...(typeof options.body === 'object' && options.body !== null
                    ? options.body
                    : {}),
                _query: query,
            };
        }
    }

    try {
        const { data, error } = await supabase.functions.invoke(
            fnName,
            invokeOptions,
        );

        if (error) {
            throw error;
        }

        return data as T;
    } catch (e) {
        if (e instanceof FunctionsHttpError && e.context) {
            const res = e.context as Response;
            const body = await res.json().catch(() => ({}));
            const msg =
                (body as { error?: string })?.error ??
                (body as { message?: string })?.message ??
                e.message;
            throw new ApiError(msg, res.status, body);
        }
        if (e instanceof ApiError) throw e;
        throw new ApiError(
            e instanceof Error ? e.message : 'Erro na requisição',
            500,
            e,
        );
    }
}

export const api = {
    async get<T>(path: string): Promise<T> {
        return invoke<T>(path, { method: 'GET' });
    },

    async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
        return invoke<T>(path, { method: 'POST', body });
    },

    async patch<T>(path: string, body?: Record<string, unknown>): Promise<T> {
        return invoke<T>(path, { method: 'PATCH', body });
    },

    async getWithParams<T>(
        path: string,
        params: Record<string, string | number | undefined>,
    ): Promise<T> {
        return invoke<T>(path, { method: 'GET', params });
    },
};
