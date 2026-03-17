import { createContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tenant } from '@/lib/types/tenant';

type TenantContextType = {
    tenant: Tenant | null;
    loading: boolean;
};

export const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        async function loadTenant() {
            const supabase = createClient();
            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (!user) {
                if (alive) setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('id', user.id)
                .single();

            const tenantId = (profile as { tenant_id?: string } | null)?.tenant_id;
            if (!tenantId) {
                if (alive) setLoading(false);
                return;
            }

            const { data: tenantData } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', tenantId)
                .single();

            if (alive) {
                setTenant((tenantData as Tenant | null) ?? null);
                setLoading(false);
            }
        }

        loadTenant().catch(() => {
            if (alive) setLoading(false);
        });

        return () => {
            alive = false;
        };
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, loading }}>
            {children}
        </TenantContext.Provider>
    );
}

