import { useState, useEffect, useCallback } from 'react';
import { serviceAgreementsApi } from '@/api/endpoints';
import type { PageOptions, ServiceAgreement } from '@/types/models';

export const useAllServiceAgreements = () => {
    const [data, setData] = useState<ServiceAgreement[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchAgreements = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await serviceAgreementsApi.getAllNonPaginated();
            setData(res.data?.data ?? []);
        } catch (err) {
            console.error('Error fetching service agreements:', err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgreements();
    }, [fetchAgreements]);

    return { data, isLoading, isError, refetch: fetchAgreements };
};

export const useServiceAgreement = (id: string | undefined) => {
    const [data, setData] = useState<ServiceAgreement | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(!!id);
    const [isError, setIsError] = useState(false);

    const fetchAgreement = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await serviceAgreementsApi.getById(id);
            setData(res.data?.data as ServiceAgreement);
        } catch (err) {
            console.error('Error fetching service agreement:', err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchAgreement();
    }, [fetchAgreement]);

    return { data, isLoading, isError, refetch: fetchAgreement };
};

export const useServiceAgreements = (params?: PageOptions) => {
    const [data, setData] = useState<ServiceAgreement[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const fetchAgreements = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const res = await serviceAgreementsApi.getAll(params);
            setData(res.data?.data ?? []);
        } catch (err) {
            console.error('Error fetching service agreements:', err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params)]);

    useEffect(() => {
        fetchAgreements();
    }, [fetchAgreements]);

    return { data, isLoading, isError, refetch: fetchAgreements };
};
