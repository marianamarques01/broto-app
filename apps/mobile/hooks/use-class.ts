import { useContext } from 'react';
import { ClassContext } from '@/contexts/ClassContext';

export function useClass() {
    const ctx = useContext(ClassContext);
    if (!ctx) throw new Error('useClass must be used within ClassProvider');
    return ctx;
}
