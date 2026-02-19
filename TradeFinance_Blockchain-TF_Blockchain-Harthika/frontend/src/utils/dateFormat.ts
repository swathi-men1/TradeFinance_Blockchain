// Date/Time formatting utilities for Indian timezone (IST - UTC+5:30)

/**
 * Format date to Indian timezone
 * @param date - Date string or Date object
 * @returns Formatted date string in IST
 */
export const formatDateIST = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Format date and time to Indian timezone
 * @param date - Date string or Date object
 * @returns Formatted date-time string in IST
 */
export const formatDateTimeIST = (date: string | Date): string => {
    return new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};

/**
 * Format date with short month to Indian timezone
 * @param date - Date string or Date object
 * @returns Formatted date string in IST (e.g., "14 Feb, 2026")
 */
export const formatDateShortIST = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format time only to Indian timezone
 * @param date - Date string or Date object
 * @returns Formatted time string in IST
 */
export const formatTimeIST = (date: string | Date): string => {
    return new Date(date).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};
