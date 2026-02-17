import { useState, useEffect } from 'react';
import type { KeyLabel, Customer } from "../types/session";

export function useConfigurationData(refreshTrigger: number = 0) {
    const [languages, setLanguages] = useState<KeyLabel[]>([]);
    const [industries, setIndustries] = useState<KeyLabel[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                // 1. Fetch Global Settings (Languages & Industries)
                const appSettings = await window.electronAPI.getSettings();

                if (isMounted) {
                    setLanguages(appSettings.languages || []);
                    setIndustries(appSettings.industries || []);
                }

                // 2. Fetch HubSpot Customers
                let companies: Customer[] = [];
                try {
                    companies = await window.electronAPI.getHubspotCompanies();
                } catch (e) {
                    console.warn("HubSpot API failed or not configured", e);
                }

                if (isMounted) {
                    setCustomers(companies && companies.length > 0 ? companies : []);
                }

            } catch (err) {
                console.error("Failed to load configuration data", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load().then();

        return () => { isMounted = false; };
    }, [refreshTrigger]);

    return { languages, industries, customers, loading };
}