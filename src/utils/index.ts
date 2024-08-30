import { format, toZonedTime } from 'date-fns-tz';

export const leadUtils = {
    SUBMIT_TO_MANAGER: 'submitToManager',
}

export const getISTTime = (date: Date) => {
    const IST_TIMEZONE = 'Asia/Kolkata';
    const istDate = toZonedTime(date, IST_TIMEZONE);
    return format(istDate, 'yyyy-MM-dd HH:mm:ss', { timeZone: IST_TIMEZONE });
};