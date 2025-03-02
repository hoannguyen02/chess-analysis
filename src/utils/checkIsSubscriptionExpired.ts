import { DEFAULT_TIME_ZONE } from '@/constants';
import { DateTime } from 'luxon';
import { getDateTimeNow } from './getDateTimeNow';

export const checkIsSubscriptionExpired = (subscriptionEnd: string | Date) => {
  // Ensure subscriptionEnd is a valid DateTime
  const subscriptionEndDate = DateTime.fromISO(
    typeof subscriptionEnd === 'string'
      ? subscriptionEnd
      : subscriptionEnd?.toISOString()
  ).setZone(DEFAULT_TIME_ZONE);

  const currentDate = getDateTimeNow();

  if (!subscriptionEndDate.isValid) {
    return true;
  }

  return currentDate > subscriptionEndDate;
};
