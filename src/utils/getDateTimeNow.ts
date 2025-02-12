import { DEFAULT_TIME_ZONE } from '@/constants';
import { DateTime } from 'luxon';

export const getDateTimeNow = (tz = DEFAULT_TIME_ZONE) => {
  return DateTime.now().setZone(tz);
};
