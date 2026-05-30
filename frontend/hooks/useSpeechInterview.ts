'use client';

import { useCallback, useEffect, useRef } from 'react';

type RecognitionResult = {
  resultIndex: number;
  results: ArrayLike<{ [index: number]: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionResult) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function useSpeechInterview(active: boolean, questionText: string) {
  const transcriptRef = useRef('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speakQuestion = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Compact'));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, []);

  const startListening = useCallback(() => {
    transcriptRef.current = '';
    if (typeof window === 'undefined') return;

    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: RecognitionResult) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        chunk += event.results[i][0].transcript;
      }
      if (chunk) {
        transcriptRef.current = `${transcriptRef.current} ${chunk}`.trim();
      }
    };

    recognition.onerror = () => {
      /* mic may be busy with video recorder */
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      /* already started */
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    return transcriptRef.current.trim();
  }, []);

  useEffect(() => {
    if (!active || !questionText) return;
    speakQuestion(questionText);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [active, questionText, speakQuestion]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return { startListening, stopListening, speakQuestion };
}
