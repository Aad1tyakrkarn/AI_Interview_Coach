import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { MLProxyService } from './ml-proxy.service';
import { logger } from '../config/logger';

interface ConversationContext {
  role: string;
  difficulty: string;
  askedQuestions: string[];
  answers: Array<{ question: string; answer: string; score?: number }>;
  resumeData?: Record<string, unknown>;
  questionCount: number;
  currentIndex: number;
}

export class AIInterviewerService {
  /**
   * Generate the next question for an interview
   */
  static async generateQuestion(interviewId: string): Promise<{
    question: string;
    metadata: { topic: string; skillArea: string; difficulty: string; expectedDuration: number };
    acknowledgement?: string;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewQuestions: {
          include: { question: true },
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    // Build context from interview history
    const context = this.buildContext(interview);

    // Get acknowledgement for previous answer if not first question
    let acknowledgement: string | undefined;
    if (context.currentIndex > 0) {
      try {
        const ackResult = await MLProxyService.post<{ message: string }>('/ml/interviewer/acknowledge', {});
        acknowledgement = ackResult.message;
      } catch {
        acknowledgement = "Thank you for that answer. ";
      }
    }

    // Generate question via ML service
    try {
      const result = await MLProxyService.post<{
        question: string;
        metadata: { topic: string; skill_area: string; difficulty: string; expected_duration_seconds: number };
      }>('/ml/interviewer/generate-question', {
        job_role: interview.targetRole || 'default',
        difficulty: interview.difficultyLevel,
        context: {
          role: interview.targetRole,
          difficulty: interview.difficultyLevel,
          asked_questions: context.askedQuestions,
          answers: context.answers,
        },
        resume_data: null,
      });

      return {
        question: result.question,
        metadata: {
          topic: result.metadata.topic,
          skillArea: result.metadata.skill_area,
          difficulty: result.metadata.difficulty,
          expectedDuration: result.metadata.expected_duration_seconds,
        },
        acknowledgement,
      };
    } catch (error) {
      logger.error('Question generation failed:', error);
      // Fallback: use pre-stored question from DB
      const currentQ = interview.interviewQuestions[context.currentIndex];
      if (currentQ?.question) {
        return {
          question: currentQ.question.text,
          metadata: {
            topic: currentQ.question.category,
            skillArea: currentQ.question.subcategory || currentQ.question.category,
            difficulty: currentQ.question.difficultyLevel,
            expectedDuration: currentQ.question.timeLimitSeconds || 120,
          },
          acknowledgement,
        };
      }
      throw new AppError('Failed to generate question', 500);
    }
  }

  /**
   * Generate a dynamic question based on conversation history.
   * This is the core method for conversational interviews: it sends
   * the full conversation context to the ML service so the next question
   * is based on what the user actually said.
   */
  static async generateDynamicQuestion(
    interviewId: string,
    conversationHistory: Array<{ role: string; content: string }>,
    lastAnswerText?: string,
  ): Promise<{
    question: string;
    metadata: { topic: string; skillArea: string; difficulty: string; expectedDuration: number };
    acknowledgement?: string;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    // Try to load resume data
    let resumeData: any = null;
    try {
      if (interview.resumeId) {
        const resume = await prisma.resume.findUnique({ where: { id: interview.resumeId } });
        resumeData = resume?.parsedData || null;
      }
    } catch {}

    // Get acknowledgement for the previous answer if provided
    let acknowledgement: string | undefined;
    if (lastAnswerText) {
      try {
        const ackResult = await MLProxyService.post<{ message: string }>('/ml/interviewer/acknowledge', {});
        acknowledgement = ackResult.message;
      } catch {
        acknowledgement = 'Thank you for that answer.';
      }
    }

    try {
      const result = await MLProxyService.post<{
        question: string;
        metadata: { topic: string; skill_area: string; difficulty: string; expected_duration_seconds: number };
      }>('/ml/interviewer/generate-dynamic', {
        job_role: interview.targetRole || 'default',
        difficulty: interview.difficultyLevel,
        conversation_history: conversationHistory,
        resume_data: resumeData,
      });

      return {
        question: result.question,
        metadata: {
          topic: result.metadata.topic,
          skillArea: result.metadata.skill_area,
          difficulty: result.metadata.difficulty,
          expectedDuration: result.metadata.expected_duration_seconds,
        },
        acknowledgement,
      };
    } catch (error) {
      logger.error('Dynamic question generation failed, falling back to standard:', error);
      // Fallback to the standard generate method
      return this.generateQuestion(interviewId);
    }
  }

  /**
   * Get an acknowledgement message for a candidate's answer
   */
  static async getAcknowledgement(_interviewId: string, _answerText: string) {
    try {
      const result = await MLProxyService.post<{ message: string }>('/ml/interviewer/acknowledge', {});
      return { acknowledgement: result.message };
    } catch {
      return { acknowledgement: 'Thank you for that answer.' };
    }
  }

  /**
   * Get an encouragement message for the candidate
   */
  static async getEncouragement(_interviewId: string) {
    try {
      const result = await MLProxyService.post<{ message: string }>('/ml/interviewer/encourage', {});
      return { message: result.message };
    } catch {
      return { message: "Take your time, there's no rush." };
    }
  }

  /**
   * Generate a follow-up question based on the previous answer
   */
  static async generateFollowUp(interviewId: string, previousQuestion: string, answer: string) {
    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) throw new AppError('Interview not found', 404);

    try {
      const result = await MLProxyService.post<{
        follow_up_question: string;
        rationale: string | null;
      }>('/ml/interviewer/follow-up', {
        previous_question: previousQuestion,
        answer,
        context: {
          role: interview.targetRole,
          difficulty: interview.difficultyLevel,
        },
      });

      return {
        followUpQuestion: result.follow_up_question,
        rationale: result.rationale,
        isFollowUp: true,
      };
    } catch {
      return {
        followUpQuestion: `Could you elaborate more on your answer? Specifically, what challenges did you face?`,
        rationale: 'Fallback follow-up',
        isFollowUp: true,
      };
    }
  }

  /**
   * Adapt difficulty based on performance
   */
  static async adaptDifficulty(interviewId: string) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { scores: true },
    });
    if (!interview) throw new AppError('Interview not found', 404);

    // Gather scores from evaluations
    const evaluations = await prisma.evaluation.findMany({
      where: { interviewId },
      orderBy: { questionIndex: 'asc' },
    });

    const scores = evaluations.map(e => {
      const metrics = e.metrics as any;
      return metrics?.correctness || 0.5;
    });

    try {
      const result = await MLProxyService.post<{
        new_difficulty: string;
        reason: string;
      }>('/ml/interviewer/adapt-difficulty', {
        scores,
        current_difficulty: interview.difficultyLevel,
      });

      // Update interview difficulty if changed
      if (result.new_difficulty !== interview.difficultyLevel) {
        await prisma.interview.update({
          where: { id: interviewId },
          data: { difficultyLevel: result.new_difficulty.toUpperCase() as any },
        });
      }

      return {
        previousDifficulty: interview.difficultyLevel,
        newDifficulty: result.new_difficulty,
        reason: result.reason,
        changed: result.new_difficulty !== interview.difficultyLevel,
      };
    } catch {
      return {
        previousDifficulty: interview.difficultyLevel,
        newDifficulty: interview.difficultyLevel,
        reason: 'Could not adapt difficulty',
        changed: false,
      };
    }
  }

  /**
   * Handle silence during interview
   */
  static async handleSilence(interviewId: string, silenceDurationSeconds: number) {
    if (silenceDurationSeconds < 5) return null;

    try {
      if (silenceDurationSeconds >= 20) {
        // Long silence - offer to skip
        return {
          type: 'offer_skip',
          message: "It seems like you might need more time. Would you like to skip this question and come back to it later?",
          silenceDuration: silenceDurationSeconds,
        };
      } else if (silenceDurationSeconds >= 10) {
        // Medium silence - encourage
        const result = await MLProxyService.post<{ message: string }>('/ml/interviewer/encourage', {});
        return {
          type: 'encouragement',
          message: result.message,
          silenceDuration: silenceDurationSeconds,
        };
      } else {
        // Short silence (5-10s) - gentle nudge
        return {
          type: 'nudge',
          message: "Take your time to formulate your thoughts.",
          silenceDuration: silenceDurationSeconds,
        };
      }
    } catch {
      return {
        type: 'encouragement',
        message: "Take your time, there's no rush.",
        silenceDuration: silenceDurationSeconds,
      };
    }
  }

  /**
   * Get closing message for interview end
   */
  static async getClosingMessage(interviewId: string) {
    try {
      const result = await MLProxyService.post<{ message: string }>('/ml/interviewer/closing', {});
      return { message: result.message };
    } catch {
      return { message: "Thank you for completing this interview. Your results will be available shortly." };
    }
  }

  /**
   * Rephrase current question
   */
  static async rephraseQuestion(question: string) {
    try {
      const result = await MLProxyService.post<{ rephrased: string }>('/ml/interviewer/rephrase', { question });
      return { original: question, rephrased: result.rephrased };
    } catch {
      return { original: question, rephrased: `To put it differently: ${question}` };
    }
  }

  /**
   * Get skip acknowledgement
   */
  static async getSkipAcknowledgement() {
    try {
      const result = await MLProxyService.post<{ message: string }>('/ml/interviewer/skip-ack', {});
      return { message: result.message };
    } catch {
      return { message: "No problem, let's move on to the next question." };
    }
  }

  /**
   * Generate an intro message for the interview based on mode, user profile, and resume
   */
  static async generateIntro(
    interviewId: string,
    userId: string,
  ): Promise<{
    introText: string;
    followUpPrompt: string;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    if (!user) throw new AppError('User not found', 404);

    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there';
    const mode = interview.mode;
    const targetRole = interview.targetRole || 'Software Engineer';
    const durationMinutes = interview.durationMinutes || 30;

    // Try to load resume data
    let resumeData: any = null;
    try {
      if (interview.resumeId) {
        const resume = await prisma.resume.findUnique({ where: { id: interview.resumeId } });
        resumeData = resume?.parsedData || null;
      }
      if (!resumeData) {
        const latestResume = await prisma.resume.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        resumeData = latestResume?.parsedData || null;
      }
    } catch {
      // Resume loading is optional
    }

    try {
      const result = await MLProxyService.post<{
        intro_text: string;
        follow_up_prompt: string;
      }>('/ml/interviewer/intro', {
        mode,
        user_name: userName,
        resume_data: resumeData,
        target_role: targetRole,
        duration_minutes: durationMinutes,
      });

      return {
        introText: result.intro_text,
        followUpPrompt: result.follow_up_prompt,
      };
    } catch (error) {
      logger.error('Intro generation failed, using fallback:', error);

      if (mode === 'PRACTICE') {
        return {
          introText: `Hi ${userName}! Welcome to your practice coaching session for the ${targetRole} role. I'll be your coach today — I'll give you real-time feedback on your posture, voice, and eye contact as we go. This is a safe space to improve, so don't worry about getting everything perfect. We have about ${durationMinutes} minutes together.`,
          followUpPrompt: `Let's start with a warm-up. Tell me a bit about yourself and why you're interested in the ${targetRole} position.`,
        };
      } else {
        return {
          introText: `Hello ${userName}, thank you for joining this interview for the ${targetRole} position. This will be a professional interview lasting approximately ${durationMinutes} minutes. I'll be evaluating your responses, and you'll receive a detailed score and report at the end.`,
          followUpPrompt: `Let's begin. Could you walk me through your background and what led you to pursue this ${targetRole} role?`,
        };
      }
    }
  }

  /**
   * Get real-time coaching feedback based on posture, voice, and eye contact metrics (Practice Coach mode)
   */
  static async getCoachingFeedback(
    interviewId: string,
    metrics: {
      eyeContact: number;
      postureScore: number;
      lightingQuality: string;
      speakingRate: number;
      fillerCount: number;
      blinkRate: number;
      answerDurationSeconds: number;
    },
  ): Promise<{
    tips: string[];
    priorityTip: string;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    try {
      const result = await MLProxyService.post<{
        tips: string[];
        priority_tip: string;
      }>('/ml/interviewer/coaching-feedback', {
        interview_id: interviewId,
        eye_contact: metrics.eyeContact,
        posture_score: metrics.postureScore,
        lighting_quality: metrics.lightingQuality,
        speaking_rate: metrics.speakingRate,
        filler_count: metrics.fillerCount,
        blink_rate: metrics.blinkRate,
        answer_duration_seconds: metrics.answerDurationSeconds,
      });

      return {
        tips: result.tips,
        priorityTip: result.priority_tip,
      };
    } catch (error) {
      logger.error('Coaching feedback failed, using threshold-based fallback:', error);

      const tips: string[] = [];

      if (metrics.eyeContact > 0 && metrics.eyeContact < 50) {
        tips.push('Try to maintain more eye contact with the camera — it shows confidence.');
      }
      if (metrics.postureScore > 0 && metrics.postureScore < 60) {
        tips.push('Sit up a bit straighter. Good posture projects confidence and engagement.');
      }
      if (metrics.speakingRate > 180) {
        tips.push('You\'re speaking a bit fast. Try slowing down to let your points land.');
      } else if (metrics.speakingRate < 100) {
        tips.push('Try to pick up the pace slightly — a steady rhythm keeps the interviewer engaged.');
      }
      if (metrics.fillerCount > 5) {
        tips.push('Watch out for filler words. Pausing briefly instead of using "um" or "uh" sounds more polished.');
      }
      if (metrics.lightingQuality === 'poor') {
        tips.push('Your lighting could be better. Try facing a light source for a clearer image.');
      }
      if (metrics.answerDurationSeconds < 30) {
        tips.push('Your answer was quite short. Try to elaborate with specific examples.');
      } else if (metrics.answerDurationSeconds > 180) {
        tips.push('Your answer was on the long side. Try to be more concise — aim for 1-2 minutes per answer.');
      }

      if (tips.length === 0) {
        tips.push('You\'re doing great! Keep up the good body language and pacing.');
      }

      return {
        tips,
        priorityTip: tips[0],
      };
    }
  }

  /**
   * Get detailed feedback on a specific answer including content and delivery (both modes)
   */
  static async getAnswerFeedback(
    interviewId: string,
    question: string,
    answer: string,
    metrics: {
      eyeContact: number;
      postureScore: number;
      speakingRate: number;
      fillerCount: number;
      answerDurationSeconds: number;
    },
  ): Promise<{
    feedback: string;
    strengths: string[];
    improvements: string[];
    transition: string;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    try {
      const result = await MLProxyService.post<{
        feedback_text: string;
        strengths: string[];
        improvements: string[];
        transition: string;
      }>('/ml/interviewer/answer-feedback', {
        interview_id: interviewId,
        question,
        answer,
        mode: interview.mode,
        eye_contact: metrics.eyeContact,
        posture_score: metrics.postureScore,
        speaking_rate: metrics.speakingRate,
        filler_count: metrics.fillerCount,
        answer_duration_seconds: metrics.answerDurationSeconds,
      });

      return {
        feedback: result.feedback_text,
        strengths: result.strengths,
        improvements: result.improvements,
        transition: result.transition,
      };
    } catch (error) {
      logger.error('Answer feedback failed, using generic fallback:', error);

      return {
        feedback: 'Good effort on that answer. You covered the key points.',
        strengths: ['You addressed the question directly.'],
        improvements: ['Consider adding a specific example from your experience to strengthen your answer.'],
        transition: 'Let\'s move on to the next question.',
      };
    }
  }

  /**
   * Generate a question based on the user's resume data and conversation history
   */
  static async generateResumeQuestion(
    interviewId: string,
    userId: string,
    conversationHistory: Array<{ role: string; content: string }>,
  ): Promise<{
    question: string;
    metadata: { topic: string; skillArea: string; difficulty: string; expectedDuration: number };
    resumeContext: string | null;
  }> {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) throw new AppError('Interview not found', 404);

    // Load the user's latest resume with parsed data
    const resume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const resumeData = resume?.parsedData || null;

    try {
      const result = await MLProxyService.post<{
        question: string;
        metadata: { topic: string; skill_area: string; difficulty: string; expected_duration_seconds: number };
        resume_context: string | null;
      }>('/ml/interviewer/resume-question', {
        resume_data: resumeData,
        conversation_history: conversationHistory,
        difficulty: interview.difficultyLevel,
        target_role: interview.targetRole || 'default',
      });

      return {
        question: result.question,
        metadata: {
          topic: result.metadata.topic,
          skillArea: result.metadata.skill_area,
          difficulty: result.metadata.difficulty,
          expectedDuration: result.metadata.expected_duration_seconds,
        },
        resumeContext: result.resume_context,
      };
    } catch (error) {
      logger.error('Resume question generation failed, falling back to standard dynamic question:', error);

      // Fallback: use standard dynamic question generation
      const dynamicResult = await this.generateDynamicQuestion(interviewId, conversationHistory);
      return {
        question: dynamicResult.question,
        metadata: dynamicResult.metadata,
        resumeContext: null,
      };
    }
  }

  private static buildContext(interview: any): ConversationContext {
    const questions = interview.interviewQuestions || [];
    return {
      role: interview.targetRole || 'default',
      difficulty: interview.difficultyLevel,
      askedQuestions: questions.filter((q: any) => q.answeredAt).map((q: any) => q.question?.text || ''),
      answers: questions.filter((q: any) => q.answerText).map((q: any) => ({
        question: q.question?.text || '',
        answer: q.answerText || '',
      })),
      resumeData: undefined,
      questionCount: interview.totalQuestions,
      currentIndex: interview.currentQuestionIndex,
    };
  }
}
