const bankAccountNumber = '6800000963908507';

const sessions = [
  { day: 'Thứ 6', slots: [['Ca chiều', '15:00 – 17:00']] },
  {
    day: 'Thứ 7 và CN',
    slots: [
      ['Ca 1', '07:30 – 09:00'],
      ['Ca 2', '09:30 – 11:00'],
      ['Ca 3', '15:00 – 17:00'],
    ],
  },
];

export const scheduleData = {
  bankAccountNumber,
  sessions,
  advancedTime: '19:00 – 20:30',
  advancedDays: 'Thứ 2, Thứ 4',
  intensiveDays: 'Thứ 3, Thứ 5, Thứ 6',
  perSession: '50.000đ/buổi',
  eightSessions: '400.000đ',
  discount: 'Giảm 200.000đ',
  twentyFourSessions: '1.000.000đ',
  bankName: 'Co-opBank · Ngân hàng Hợp tác xã Việt Nam',
  accountName: 'HO KINH DOANH TRAN THI NGOC SAO',
};
export type ScheduleData = typeof scheduleData;
