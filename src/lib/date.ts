import dayjs, { type Dayjs } from 'dayjs';

export const formatDate = (date: string | number | Date | Dayjs) =>
  dayjs(date).format('YYYY/MM/DD HH:mm');
