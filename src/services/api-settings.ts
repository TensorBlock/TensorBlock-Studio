export interface ApiSettings {
    provider: string;
    apiKey: string;
    baseUrl?: string;
    organizationId?: string;
    apiVersion?: string;
    additional?: Record<string, string | number | boolean>;
}
