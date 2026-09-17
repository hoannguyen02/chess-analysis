import { useLearnerText } from './LearnerLanguage';
import { VscPlay, VscDebugStop } from 'react-icons/vsc';
import { createContext, useContext, useEffect, useState } from 'react';
import { chooseVoice, englishVoices, voiceKey } from '@/lib/english/voices';
import s from './EnglishStudio.module.css';

export const VoiceContext = createContext<{
  value: string;
  onChange: (value: string) => void;
}>({ value: '', onChange: () => {} });

export function VoicePicker({ disabled = false }: { disabled?: boolean }) {
  const t = useLearnerText();
  const { value, onChange } = useContext(VoiceContext);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(true);
  const { read, stop, playing, error } = useReadText();
  useEffect(() => {
    if (!window.speechSynthesis) {
      setSupported(false);
      return;
    }
    const synth = window.speechSynthesis;
    const update = () => setVoices(englishVoices(synth.getVoices()));
    update();
    synth.addEventListener('voiceschanged', update);
    return () => synth.removeEventListener('voiceschanged', update);
  }, []);
  const automaticVoice = chooseVoice(voices, '');
  const missing = !!value && !voices.some((v) => voiceKey(v) === value);
  return (
    <div className={`${s.voicePicker} ${s.voiceCompact}`}>
      <label className={s.field}>
        <span>{t('Voice')}</span>
        <select
          aria-label={t('English voice')}
          disabled={disabled || !supported || !voices.length}
          value={missing ? '' : value}
          onChange={(e) => {
            stop();
            onChange(e.target.value);
          }}
        >
          <option value="">
            {t('Automatic ·')}{' '}
            {automaticVoice?.name ||
              t('Google UK English Male (when available)')}
          </option>
          {voices.map((voice) => (
            <option key={voiceKey(voice)} value={voiceKey(voice)}>
              {voice.name} · {voice.lang}
              {voice.default ? t(' · Device default') : ''}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={s.preferenceIcon}
        aria-label={playing ? t('Stop voice preview') : t('Preview voice')}
        title={playing ? t('Stop preview') : t('Preview voice')}
        disabled={disabled || !supported}
        onClick={() =>
          playing
            ? stop()
            : read(
                'Hello! Let’s practice English together. Choose the voice you enjoy listening to.'
              )
        }
      >
        {playing ? (
          <VscDebugStop size={18} aria-hidden="true" />
        ) : (
          <VscPlay size={18} aria-hidden="true" />
        )}
      </button>
      {(!supported || missing || !voices.length) && (
        <p className={s.voiceHint}>
          {!supported
            ? t('Voice playback is unavailable in this browser.')
            : missing
              ? `Your saved voice is unavailable here. Using ${automaticVoice?.name || 'the default English voice'}.`
              : !voices.length
                ? t(
                    'Waiting for English voices from your device. Default playback may still work.'
                  )
                : t(
                    'Choose by name and accent. Preview to find a voice you like.'
                  )}
        </p>
      )}
      {error && (
        <p role="alert" className={s.voiceHint}>
          {t(error)}
        </p>
      )}
    </div>
  );
}

export function useReadText(preference?: string) {
  const settings = useContext(VoiceContext);
  const choice = preference ?? settings.value;
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  useEffect(
    () => () => {
      window.speechSynthesis?.cancel();
    },
    [choice]
  );
  const read = (text: string, rate = 1) => {
    setError('');
    if (!('speechSynthesis' in window)) {
      setError(
        'Audio playback is unavailable in this browser. Try a browser with speech synthesis support.'
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    const voice = chooseVoice(window.speechSynthesis.getVoices(), choice);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = (e) => {
      setPlaying(false);
      if (!['interrupted', 'canceled'].includes(e.error))
        setError(
          'Audio could not play. Check that an English voice is installed in your browser or device.'
        );
    };
    window.speechSynthesis.speak(utterance);
  };
  const stop = () => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
  };
  return { read, stop, playing, error };
}
