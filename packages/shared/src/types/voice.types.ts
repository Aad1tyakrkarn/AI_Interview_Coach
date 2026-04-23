export interface IVoiceMetrics {
  speakingRate: number;
  pauseCount: number;
  avgPauseDuration: number;
  pitchMean: number;
  pitchVariance: number;
  toneClassification: string;
  fillerWords: IFillerWord[];
  totalFillerCount: number;
  volumeLevel: number;
  clarity: number;
}

export interface IVoiceAnalysis {
  interviewId: string;
  questionIndex: number;
  metrics: IVoiceMetrics;
}

export interface IFillerWord {
  word: string;
  count: number;
  timestamps: number[];
}

export interface ITranscriptSegment {
  questionIndex: number;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  edited: boolean;
  editedText?: string;
}

export interface ITranscript {
  interviewId: string;
  segments: ITranscriptSegment[];
  fullText: string;
  language: string;
  createdAt: Date;
}
