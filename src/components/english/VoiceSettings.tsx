import { useLearnerText } from './LearnerLanguage';
import { VscPlay, VscDebugStop } from 'react-icons/vsc';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  chooseVoice,
  chooseConversationVoice,
  SpeechLine,
  englishVoices,
  voiceKey,
} from '@/lib/english/voices';
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

// Only one reader owns browser speech at a time, including between sentences.
let cancelActiveReader: (() => void) | undefined;

export function useReadText(preference?: string) {
  const settings = useContext(VoiceContext);
  const choice = preference ?? settings.value;
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stop = useCallback(() => {
    generation.current++;
    clearTimeout(timer.current);
    if (cancelActiveReader === stop) {
      cancelActiveReader = undefined;
      window.speechSynthesis?.cancel();
    }
    setPlaying(false);
    setActiveIndex(null);
  }, []);
  useEffect(() => stop, [choice, stop]);

  const readSequence = (texts: (string | SpeechLine)[], rate = 1) => {
    cancelActiveReader?.();
    stop();
    setError('');
    if (!window.speechSynthesis) {
      setError(
        'Audio playback is unavailable in this browser. Try a browser with speech synthesis support.'
      );
      return;
    }
    if (!texts.length) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    cancelActiveReader = stop;
    const run = generation.current;
    setPlaying(true);
    const speak = (index: number) => {
      if (run !== generation.current) return;
      const line = texts[index];
      const utterance = new SpeechSynthesisUtterance(
        typeof line === 'string' ? line : line.text
      );
      utterance.lang = 'en-US';
      utterance.rate = rate;
      const voice = chooseConversationVoice(
        synth.getVoices(),
        typeof line === 'string' ? undefined : line.speaker,
        choice
      );
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.onstart = () => {
        if (run === generation.current) setActiveIndex(index);
      };
      utterance.onend = () => {
        if (run !== generation.current) return;
        setActiveIndex(null);
        if (index + 1 < texts.length) {
          timer.current = setTimeout(() => speak(index + 1), 300);
        } else stop();
      };
      utterance.onerror = (event) => {
        if (run !== generation.current) return;
        stop();
        if (!['interrupted', 'canceled'].includes(event.error)) {
          setError(
            'Audio could not play. Check that an English voice is installed in your browser or device.'
          );
        }
      };
      synth.speak(utterance);
    };
    speak(0);
  };
  const read = (text: string, rate = 1) => readSequence([text], rate);
  return { read, readSequence, stop, playing, activeIndex, error };
}
