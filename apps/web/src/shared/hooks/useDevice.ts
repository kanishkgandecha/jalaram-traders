/**
 * useDevice Hook
 * ===============
 * Detect device type based on viewport width
 */

import { useState, useEffect } from 'react';

interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    screenWidth: number;
}

const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
};

export function useDevice(): DeviceInfo {
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
        const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
        return {
            isMobile: width < BREAKPOINTS.mobile,
            isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
            isDesktop: width >= BREAKPOINTS.tablet,
            screenWidth: width,
        };
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setDeviceInfo({
                isMobile: width < BREAKPOINTS.mobile,
                isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
                isDesktop: width >= BREAKPOINTS.tablet,
                screenWidth: width,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return deviceInfo;
}

export default useDevice;
