import { useLearnerText } from './LearnerLanguage';
import { useCallback, useEffect, useRef, useState } from 'react';
import s from './EnglishStudio.module.css';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export default function SpeechRecorder({
  onTranscript,
  disabled,
  onBusyChange,
  allowTranscription = true,
}: {
  onTranscript: (value: string) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  allowTranscription?: boolean;
}) {
  const t = useLearnerText();
  const [available, setAvailable] = useState(false);
  const [canRecognize, setCanRecognize] = useState(false);
  const [transcribe, setTranscribe] = useState(false);
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [audio, setAudio] = useState('');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    onBusyChange(recording || starting || recognizing);
  }, [recording, starting, recognizing, onBusyChange]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const url = useRef('');
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invalidate = useCallback(() => {
    generation.current += 1;
  }, []);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      recognition.current?.stop();
    } catch {
      /* Already stopped. */
    }
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    setRecording(false);
  };
  useEffect(() => {
    setAvailable(
      !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== 'undefined'
    );
    const w = window as SpeechWindow;
    setCanRecognize(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      invalidate();
      if (timer.current) clearTimeout(timer.current);
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.onerror = null;
        recognition.current.onresult = null;
        recognition.current.abort();
      }
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state === 'recording') recorder.current.stop();
      }
      stream.current?.getTracks().forEach((track) => track.stop());
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, [invalidate]);
  const start = async () => {
    const run = ++generation.current;
    setStarting(true);
    setError('');
    setTranscript('');
    onTranscript('');
    if (url.current) URL.revokeObjectURL(url.current);
    setAudio('');
    url.current = '';
    window.speechSynthesis?.cancel();
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (run !== generation.current) {
        input.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = input;
      const next = new MediaRecorder(input);
      recorder.current = next;
      const chunks: BlobPart[] = [];
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      next.onstop = () => {
        if (run !== generation.current) return;
        const blob = new Blob(chunks, { type: next.mimeType || 'audio/webm' });
        url.current = URL.createObjectURL(blob);
        setAudio(url.current);
        setRecording(false);
        input.getTracks().forEach((track) => track.stop());
      };
      next.onerror = () => {
        setError('Recording stopped unexpectedly. Please try again.');
        stop();
      };
      next.start();
      setRecording(true);
      if (allowTranscription && transcribe) {
        const w = window as SpeechWindow;
        const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
        if (Constructor) {
          const rec = new Constructor();
          recognition.current = rec;
          rec.lang = 'en-US';
          rec.continuous = true;
          rec.interimResults = false;
          rec.onresult = (event) => {
            if (run !== generation.current) return;
            const value = Array.from(event.results)
              .filter((result) => result.isFinal)
              .map((result) => result[0].transcript)
              .join(' ');
            setTranscript(value);
            onTranscript(value);
          };
          rec.onerror = (event) => {
            if (run === generation.current) {
              setRecognizing(false);
              setError(
                `Transcription unavailable (${event.error}). Your recording can still be played back.`
              );
            }
          };
          rec.onend = () => {
            if (run === generation.current) setRecognizing(false);
          };
          try {
            rec.start();
            setRecognizing(true);
          } catch {
            setError(
              'Transcription could not start. You can still record and listen back.'
            );
          }
        }
      }
      timer.current = setTimeout(stop, 60000);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (run === generation.current)
        setError(
          'Microphone access failed. Allow microphone access in your browser, then try again.'
        );
    } finally {
      if (run === generation.current) setStarting(false);
    }
  };
  return (
    <div className={s.stack}>
      <p className={s.muted}>
        {t(
          'Record up to 60 seconds. Your recording stays in this session and is discarded when you leave this activity.'
        )}
      </p>
      {!available && (
        <p className={s.notice}>
          {t(
            'Recording is not available here. Open this page over HTTPS or localhost in a browser with microphone support. You can still listen and practice aloud.'
          )}
        </p>
      )}
      {allowTranscription &&
        (canRecognize ? (
          <label className={`${s.row} ${s.muted}`}>
            <input
              type="checkbox"
              checked={transcribe}
              disabled={recording || starting || recognizing || disabled}
              onChange={(e) => setTranscribe(e.target.checked)}
            />
            {t(
              'Enable browser transcription for a word-match score. Your browser may send audio to its speech service.'
            )}
          </label>
        ) : (
          <p className={s.muted}>
            {t(
              'This browser does not support speech transcription. Record and compare by listening; automatic speech scores are unavailable.'
            )}
          </p>
        ))}
      <div className={s.actions}>
        <button
          type="button"
          className={recording ? s.danger : s.primary}
          disabled={
            !available || starting || disabled || (!recording && recognizing)
          }
          onClick={() => (recording ? stop() : void start())}
        >
          {starting
            ? t('Opening microphone…')
            : recording
              ? t('■ Stop recording')
              : t('● Record my voice')}
        </button>
        {recording && (
          <span role="status" className={s.recording}>
            {t('Recording…')}
          </span>
        )}
        {!recording && recognizing && (
          <span role="status" className={s.muted}>
            {t('Finishing transcript…')}
          </span>
        )}
      </div>
      {audio && (
        <audio
          aria-label={t('Your recording')}
          controls
          src={audio}
          style={{ width: '100%' }}
        />
      )}
      {transcript && (
        <div className={s.notice}>
          <p className={s.eyebrow}>{t('What the browser heard')}</p>
          <p style={{ marginTop: 8 }}>{transcript}</p>
        </div>
      )}
      {error && (
        <p role="alert" className={`${s.notice} ${s.error}`}>
          {t(error)}
        </p>
      )}
      <p className={s.muted}>
        {t(
          'Word match compares recognized words with the lesson text. It is not a pronunciation or fluency assessment. Recognition errors can affect the result.'
        )}
      </p>
    </div>
  );
}
