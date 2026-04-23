import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { MLProxyService } from './ml-proxy.service';
import { logger } from '../config/logger';

export class VoiceService {
  static async createTranscript(data: {
    interviewId: string;
    segments: Array<{
      questionIndex: number;
      speaker: 'interviewer' | 'candidate';
      text: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
    fullText?: string;
    language?: string;
  }) {
    // Build fullText from segments if not provided
    const fullText = data.fullText || data.segments.map(s => s.text).join(' ');

    const transcript = await prisma.transcript.create({
      data: {
        interviewId: data.interviewId,
        segments: data.segments as any,
        fullText,
        language: data.language || 'en',
      },
    });

    // Trigger async voice analysis
    this.triggerAnalysis(data.interviewId, fullText).catch(err => {
      logger.error('Voice analysis trigger failed:', err);
    });

    return transcript;
  }

  static async getTranscripts(interviewId: string) {
    const transcripts = await prisma.transcript.findMany({
      where: { interviewId },
      orderBy: { createdAt: 'desc' },
    });
    return transcripts;
  }

  static async updateTranscript(transcriptId: string, data: {
    segments?: any;
    fullText?: string;
  }) {
    const transcript = await prisma.transcript.findUnique({
      where: { id: transcriptId },
    });
    if (!transcript) throw new AppError('Transcript not found', 404);

    const updated = await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        ...(data.segments && { segments: data.segments }),
        ...(data.fullText && { fullText: data.fullText }),
      },
    });
    return updated;
  }

  static async getAnalysis(interviewId: string) {
    const analyses = await prisma.voiceAnalysis.findMany({
      where: { interviewId },
      orderBy: { questionIndex: 'asc' },
    });

    if (analyses.length === 0) {
      // Compute basic analysis from interview question data
      const questions = await prisma.interviewQuestion.findMany({
        where: { interviewId, isAnswered: true },
        orderBy: { questionIndex: 'asc' },
      });

      if (questions.length === 0) {
        return { interviewId, analyses: [], summary: null };
      }

      const totalWords = questions.reduce((sum, q) => sum + (q.answerText?.split(/\s+/).filter(Boolean).length || 0), 0);
      const totalTime = questions.reduce((sum, q) => sum + (q.timeTakenSeconds || 0), 0);
      const avgWPM = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;

      const fillerWordsList = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'literally', 'so'];
      let fillerCount = 0;
      questions.forEach(q => {
        const text = (q.answerText || '').toLowerCase();
        fillerCount += (text.match(/you know/g) || []).length;
        const words = text.split(/\s+/);
        fillerCount += words.filter(w => fillerWordsList.includes(w) && w !== 'you').length;
      });

      return {
        interviewId,
        analyses: [],
        summary: {
          avgSpeakingRate: avgWPM,
          totalPauses: questions.length,
          avgPauseDuration: 0,
          avgPitchMean: 0,
          dominantTone: 'neutral',
          totalFillerCount: fillerCount,
          topFillerWords: [],
        },
      };
    }

    // Build summary across all questions
    const allMetrics = analyses.map(a => a.metrics as any);
    const summary = {
      avgSpeakingRate: this.avg(allMetrics.map(m => m.speakingRate || 0)),
      totalPauses: allMetrics.reduce((sum, m) => sum + (m.pauseCount || 0), 0),
      avgPauseDuration: this.avg(allMetrics.flatMap(m => m.pauses || [])),
      avgPitchMean: this.avg(allMetrics.map(m => m.pitchMean || 0)),
      dominantTone: this.mode(allMetrics.map(m => m.tone || 'neutral')),
      totalFillerCount: allMetrics.reduce((sum, m) => sum + (m.totalFillerCount || 0), 0),
      topFillerWords: this.topFillers(allMetrics),
    };

    return { interviewId, analyses, summary };
  }

  static async getMetrics(interviewId: string) {
    const analyses = await prisma.voiceAnalysis.findMany({
      where: { interviewId },
      orderBy: { questionIndex: 'asc' },
    });

    const transcript = await prisma.transcript.findFirst({
      where: { interviewId },
      orderBy: { createdAt: 'desc' },
    });

    // If no voice analyses exist, compute basic metrics from interview question data
    if (analyses.length === 0) {
      const questions = await prisma.interviewQuestion.findMany({
        where: { interviewId, isAnswered: true },
        orderBy: { questionIndex: 'asc' },
      });

      // Calculate basic metrics from answers
      const totalWords = questions.reduce((sum, q) => sum + (q.answerText?.split(/\s+/).filter(Boolean).length || 0), 0);
      const totalTime = questions.reduce((sum, q) => sum + (q.timeTakenSeconds || 0), 0);
      const avgWPM = totalTime > 0 ? Math.round((totalWords / totalTime) * 60) : 0;

      // Count fillers from answer text
      const fillerWordsList = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'literally', 'so'];
      let fillerCount = 0;
      questions.forEach(q => {
        const text = (q.answerText || '').toLowerCase();
        // Count multi-word fillers first
        fillerCount += (text.match(/you know/g) || []).length;
        // Count single-word fillers
        const words = text.split(/\s+/);
        fillerCount += words.filter(w => fillerWordsList.includes(w) && w !== 'you').length;
      });

      const perQuestion = questions.map((q) => {
        const wordCount = q.answerText?.split(/\s+/).filter(Boolean).length || 0;
        const duration = q.timeTakenSeconds || 0;
        return {
          questionIndex: q.questionIndex,
          duration,
          wordCount,
          wpm: duration > 0 ? Math.round((wordCount / duration) * 60) : 0,
        };
      });

      // Speed score
      let speedScore = 100;
      if (avgWPM < 100 || avgWPM > 200) speedScore = 40;
      else if (avgWPM < 120 || avgWPM > 180) speedScore = 60;
      else if (avgWPM < 130 || avgWPM > 160) speedScore = 80;

      return {
        interviewId,
        speakingRate: avgWPM,
        pauseCount: questions.length, // approximate
        fillerCount,
        totalDuration: totalTime,
        averageConfidence: 0.7, // default
        clarity: avgWPM >= 120 && avgWPM <= 160 ? 'good' : avgWPM < 120 ? 'slow' : 'fast',
        pacing: avgWPM >= 120 && avgWPM <= 160 ? 'good' : avgWPM < 120 ? 'slow' : 'fast',
        silencePercentage: 0,
        perQuestion,
        questionMetrics: perQuestion,
        overallMetrics: {
          avgSpeakingRate: avgWPM,
          speedScore: Math.min(100, speedScore),
          pauseScore: Math.max(0, 100 - questions.length * 5),
          totalFillerWords: fillerCount,
          totalDuration: totalTime,
          questionsAnalyzed: questions.length,
        },
        transcript: transcript ? {
          id: transcript.id,
          fullText: transcript.fullText,
          language: transcript.language,
        } : null,
      };
    }

    const metrics = analyses.map(a => {
      const m = a.metrics as any;
      return {
        questionIndex: a.questionIndex,
        speakingRate: m.speakingRate || 0,
        pauseCount: (m.pauses || []).length,
        avgPauseDuration: this.avg(m.pauses || []),
        pitchMean: m.pitchMean || 0,
        pitchStd: m.pitchStd || 0,
        tone: m.tone || 'neutral',
        fillerCount: m.totalFillerCount || 0,
        duration: m.totalDuration || 0,
      };
    });

    // Calculate speed score (ideal: 130-160 WPM)
    const avgRate = this.avg(metrics.map(m => m.speakingRate));
    let speedScore = 100;
    if (avgRate < 100 || avgRate > 200) speedScore = 40;
    else if (avgRate < 120 || avgRate > 180) speedScore = 60;
    else if (avgRate < 130 || avgRate > 160) speedScore = 80;

    // Pause score (fewer unnecessary pauses = better)
    const totalPauses = metrics.reduce((s, m) => s + m.pauseCount, 0);
    const pauseScore = Math.max(0, 100 - totalPauses * 5);
    const totalFillerWords = metrics.reduce((s, m) => s + m.fillerCount, 0);
    const totalDuration = metrics.reduce((s, m) => s + m.duration, 0);

    return {
      interviewId,
      // Flat fields for frontend compatibility
      speakingRate: Math.round(avgRate),
      pauseCount: totalPauses,
      fillerCount: totalFillerWords,
      totalDuration,
      averageConfidence: 0.75,
      clarity: avgRate >= 120 && avgRate <= 160 ? 'good' : avgRate < 120 ? 'slow' : 'fast',
      pacing: avgRate >= 120 && avgRate <= 160 ? 'good' : avgRate < 120 ? 'slow' : 'fast',
      silencePercentage: 0,
      perQuestion: metrics,
      // Nested structure
      questionMetrics: metrics,
      overallMetrics: {
        avgSpeakingRate: Math.round(avgRate),
        speedScore: Math.min(100, speedScore),
        pauseScore: Math.min(100, pauseScore),
        totalFillerWords,
        totalDuration,
        questionsAnalyzed: metrics.length,
      },
      transcript: transcript ? {
        id: transcript.id,
        fullText: transcript.fullText,
        language: transcript.language,
      } : null,
    };
  }

  static async saveAnalysis(interviewId: string, questionIndex: number, metrics: Record<string, unknown>) {
    return prisma.voiceAnalysis.create({
      data: {
        interviewId,
        questionIndex,
        metrics: metrics as any,
      },
    });
  }

  static async transcribeAudio(audioUrl: string): Promise<{ text: string; segments: any[]; language: string }> {
    try {
      const result = await MLProxyService.post<any>('/ml/voice/transcribe', { audio_url: audioUrl });
      return {
        text: result.text,
        segments: result.segments || [],
        language: result.language || 'en',
      };
    } catch (error) {
      logger.error('Transcription via ML service failed:', error);
      return { text: '', segments: [], language: 'en' };
    }
  }

  static async analyzeAudio(audioUrl: string, interviewId: string, questionIndex: number) {
    try {
      const result = await MLProxyService.post<any>('/ml/voice/analyze', {
        audio_url: audioUrl,
        interview_id: interviewId,
        question_index: questionIndex,
      });

      const metrics = {
        speakingRate: result.speaking_rate,
        pauses: result.pauses,
        pauseCount: (result.pauses || []).length,
        pitchMean: result.pitch_mean,
        pitchStd: result.pitch_std,
        tone: result.tone,
        fillerWords: result.filler_words || [],
        totalFillerCount: (result.filler_words || []).reduce((s: number, f: any) => s + f.count, 0),
        totalDuration: result.total_duration,
      };

      await this.saveAnalysis(interviewId, questionIndex, metrics);
      return metrics;
    } catch (error) {
      logger.error('Voice analysis via ML service failed:', error);
      throw new AppError('Voice analysis failed', 500);
    }
  }

  private static async triggerAnalysis(interviewId: string, text: string) {
    // Detect fillers from transcript text
    try {
      const result = await MLProxyService.post<any>('/ml/voice/detect-fillers', text);
      logger.info(`Filler detection for ${interviewId}: ${result.total_filler_count} fillers found`);
    } catch {
      // Non-critical, just log
    }
  }

  private static avg(nums: number[]): number {
    if (nums.length === 0) return 0;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
  }

  private static mode(values: string[]): string {
    const counts: Record<string, number> = {};
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  private static topFillers(allMetrics: any[]): Array<{ word: string; count: number }> {
    const fillerMap: Record<string, number> = {};
    allMetrics.forEach(m => {
      (m.fillerWords || []).forEach((f: any) => {
        fillerMap[f.word] = (fillerMap[f.word] || 0) + f.count;
      });
    });
    return Object.entries(fillerMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}
