'use client';

import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  VscDashboard,
  VscDebugRestart,
  VscPlay,
  VscPrimitiveSquare,
} from 'react-icons/vsc';

const TIMER_PRESETS_MINUTES = [1, 3, 5, 7] as const;

type TeachingTimerProps = {
  compact?: boolean;
};

export const TeachingTimer = ({ compact = false }: TeachingTimerProps) => {
  const t = useTranslations();
  const defaultPresetSeconds = TIMER_PRESETS_MINUTES[1] * 60;
  const [selectedMinutes, setSelectedMinutes] = useState<number>(
    TIMER_PRESETS_MINUTES[1]
  );
  const [remainingSeconds, setRemainingSeconds] =
    useState(defaultPresetSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, remainingSeconds]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const selectPreset = (minutes: number) => {
    setSelectedMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    setRemainingSeconds(selectedMinutes * 60);
    setIsRunning(false);
  };

  const handlePrimaryAction = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(selectedMinutes * 60);
      setIsRunning(true);
      return;
    }

    setIsRunning((current) => !current);
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white ${
        compact ? 'p-3' : 'p-5'
      }`}
    >
      {compact ? (
        <div className="flex items-center justify-between gap-2">
          <div
            className={`rounded-2xl bg-slate-900 px-4 py-2 text-xl font-semibold tracking-[0.2em] text-white shadow-sm ${
              remainingSeconds === 0 ? 'bg-rose-600' : ''
            }`}
          >
            {formattedTime}
          </div>
          <div className="flex items-center gap-1">
            <Button
              color="primary"
              onClick={handlePrimaryAction}
              aria-label={
                remainingSeconds === 0
                  ? t('common.timer.restart')
                  : isRunning
                    ? t('common.timer.pause')
                    : t('common.timer.start')
              }
            >
              {remainingSeconds === 0 ? (
                <VscDebugRestart size={18} />
              ) : isRunning ? (
                <VscPrimitiveSquare size={18} />
              ) : (
                <VscPlay size={18} />
              )}
            </Button>
            <Button
              color="gray"
              onClick={handleReset}
              aria-label={t('common.timer.reset')}
            >
              <VscDebugRestart size={18} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-slate-100 p-2 text-slate-600">
              <VscDashboard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('common.timer.title')}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t('common.timer.description')}
              </p>
            </div>
          </div>
          <div
            className={`rounded-2xl bg-slate-900 px-4 py-2 text-3xl font-semibold tracking-[0.2em] text-white shadow-sm ${
              remainingSeconds === 0 ? 'bg-rose-600' : ''
            }`}
          >
            {formattedTime}
          </div>
        </div>
      )}

      <div className={`grid grid-cols-4 gap-2 ${compact ? 'mt-2' : 'mt-4'}`}>
        {TIMER_PRESETS_MINUTES.map((minutes) => {
          const isActive = minutes === selectedMinutes;

          return (
            <button
              key={minutes}
              type="button"
              onClick={() => selectPreset(minutes)}
              className={`rounded-lg border px-3 ${
                compact ? 'py-1.5 text-xs' : 'py-2 text-sm'
              } font-semibold transition ${
                isActive
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {minutes} {t('common.timer.minutes-short')}
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button color="primary" onClick={handlePrimaryAction}>
            {remainingSeconds === 0
              ? t('common.timer.restart')
              : isRunning
                ? t('common.timer.pause')
                : t('common.timer.start')}
          </Button>
          <Button color="gray" onClick={handleReset}>
            {t('common.timer.reset')}
          </Button>
        </div>
      )}

      {!compact && (
        <div className="mt-3 text-sm font-medium text-slate-500">
          {remainingSeconds === 0
            ? t('common.timer.times-up')
            : t('common.timer.prompt')}
        </div>
      )}
    </div>
  );
};
