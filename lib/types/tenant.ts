export type TenantConfig = {
    mascot_name: string;
    primary_color: string;
    features: {
        audio_overview?: boolean;
        mind_map?: boolean;
        flashcards?: boolean;
        [key: string]: boolean | undefined;
    };
};

export type Tenant = {
    id: string;
    slug: string;
    name: string;
    config: TenantConfig;
};

