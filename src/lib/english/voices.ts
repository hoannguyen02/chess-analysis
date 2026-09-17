type Voice = { voiceURI: string; name: string; lang: string; default: boolean };
export function voiceKey(voice: Voice): string {
  return JSON.stringify([voice.voiceURI, voice.lang, voice.name]);
}
export function englishVoices<T extends Voice>(voices: T[]): T[] {
  return voices
    .filter((v) => /^en(?:[-_]|$)/i.test(v.lang))
    .filter(
      (v, i, list) =>
        list.findIndex((other) => voiceKey(other) === voiceKey(v)) === i
    )
    .sort(
      (a, b) =>
        Number(b.default) - Number(a.default) ||
        a.lang.localeCompare(b.lang) ||
        a.name.localeCompare(b.name)
    );
}
export function chooseVoice<T extends Voice>(
  voices: T[],
  choice: string
): T | undefined {
  const english = englishVoices(voices);
  return (
    english.find((v) => voiceKey(v) === choice) ||
    english.find((v) => v.name === 'Google UK English Male') ||
    english.find((v) => v.default) ||
    english.find((v) => v.lang.toLowerCase() === 'en-us') ||
    english[0]
  );
}

export type SpeechLine = { text: string; speaker?: 'A' | 'B' };

export function conversationLine(line: string): SpeechLine {
  const match = line.trim().match(/^([AB]):\s*(.*)$/i);
  return {
    text: line.trim().replace(/^[^:\n]{1,30}:\s*/, ''),
    speaker: match ? (match[1].toUpperCase() as 'A' | 'B') : undefined,
  };
}

export function chooseConversationVoice<T extends Voice>(
  voices: T[],
  speaker: SpeechLine['speaker'],
  choice: string
): T | undefined {
  const preferred =
    speaker === 'A'
      ? 'Google UK English Male'
      : speaker === 'B'
        ? 'Google UK English Female'
        : undefined;
  return (
    englishVoices(voices).find((voice) => voice.name === preferred) ||
    chooseVoice(voices, choice)
  );
}
