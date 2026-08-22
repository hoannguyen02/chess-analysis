'use client';

import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  VscBell,
  VscBellSlash,
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
  const defaultPresetMinutes = TIMER_PRESETS_MINUTES[0];
  const defaultPresetSeconds = defaultPresetMinutes * 60;
  const [selectedMinutes, setSelectedMinutes] = useState<number>(
    defaultPresetMinutes
  );
  const [remainingSeconds, setRemainingSeconds] =
    useState(defaultPresetSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAudioUnlockedRef = useRef(false);

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return null;

    const audioContext = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = audioContext;

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    return audioContext;
  }, []);

  const playTimesUpChime = useCallback(() => {
    if (
      typeof window === 'undefined' ||
      !soundEnabled ||
      !isAudioUnlockedRef.current
    ) {
      return;
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(1.5, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    [
      {
        frequency: 880,
        offset: 0,
        duration: 0.62,
        gain: 0.92,
        type: 'triangle' as OscillatorType,
      },
      {
        frequency: 1174,
        offset: 0.08,
        duration: 0.58,
        gain: 0.76,
        type: 'sine' as OscillatorType,
      },
      {
        frequency: 1567,
        offset: 0.16,
        duration: 0.54,
        gain: 0.62,
        type: 'sine' as OscillatorType,
      },
      {
        frequency: 1760,
        offset: 0.22,
        duration: 0.5,
        gain: 0.5,
        type: 'triangle' as OscillatorType,
      },
    ].forEach(({ frequency, offset, duration, gain, type }) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const startAt = now + offset;
      const endAt = startAt + duration;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gainNode.gain.setValueAtTime(0.0001, startAt);
      gainNode.gain.exponentialRampToValueAtTime(gain, startAt + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      oscillator.start(startAt);
      oscillator.stop(endAt);
    });
  }, [soundEnabled]);

  const unlockAudio = useCallback(async () => {
    const audioContext = await ensureAudioContext();
    if (!audioContext) return;

    isAudioUnlockedRef.current = true;
  }, [ensureAudioContext]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          playTimesUpChime();
          return 0;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, playTimesUpChime, remainingSeconds]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const selectPreset = (minutes: number) => {
    void unlockAudio();
    setSelectedMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    void unlockAudio();
    setRemainingSeconds(selectedMinutes * 60);
    setIsRunning(false);
  };

  const handlePrimaryAction = async () => {
    await unlockAudio();

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
            className={`min-w-[8.5rem] rounded-2xl bg-slate-900 px-4 py-2 text-center text-xl font-semibold tabular-nums tracking-[0.2em] text-[var(--s-bg)] shadow-sm ${
              remainingSeconds === 0 ? 'bg-rose-600 text-white' : ''
            }`}
          >
            {formattedTime}
          </div>
          <div className="flex items-center gap-1">
            <Button
              color="gray"
              className="border-0 bg-[var(--s-bg)] text-slate-900 hover:bg-[#df9412] focus:ring-2 focus:ring-[#f5a623]/40"
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
            <Button
              color="gray"
              onClick={async () => {
                await unlockAudio();
                setSoundEnabled((current) => !current);
              }}
              aria-label={
                soundEnabled
                  ? t('common.timer.mute-sound')
                  : t('common.timer.enable-sound')
              }
            >
              {soundEnabled ? (
                <VscBell size={18} />
              ) : (
                <VscBellSlash size={18} />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[#f5a623]/15 p-2 text-[var(--s-bg)]">
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
            className={`min-w-[10rem] rounded-2xl bg-slate-900 px-4 py-2 text-center text-3xl font-semibold tabular-nums tracking-[0.2em] text-[var(--s-bg)] shadow-sm ${
              remainingSeconds === 0 ? 'bg-rose-600 text-white' : ''
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
                  ? 'border-[var(--s-bg)] bg-[#f5a623]/10 text-[#b87400]'
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
          <Button
            color="gray"
            className="border-0 bg-[var(--s-bg)] text-slate-900 hover:bg-[#df9412] focus:ring-2 focus:ring-[#f5a623]/40"
            onClick={handlePrimaryAction}
          >
            {remainingSeconds === 0
              ? t('common.timer.restart')
              : isRunning
                ? t('common.timer.pause')
                : t('common.timer.start')}
          </Button>
          <Button color="gray" onClick={handleReset}>
            {t('common.timer.reset')}
          </Button>
          <Button
            color="gray"
            onClick={async () => {
              await unlockAudio();
              setSoundEnabled((current) => !current);
            }}
          >
            {soundEnabled
              ? t('common.timer.sound-on')
              : t('common.timer.sound-off')}
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
