export interface IHeadPose {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface ICameraFrame {
  timestamp: number;
  eyeContactDetected: boolean;
  headPose: IHeadPose;
  facialExpression: string;
  tensionScore: number;
  blinkRate: number;
}

export interface IAggregatedCameraMetrics {
  eyeContactPercentage: number;
  avgPostureScore: number;
  dominantExpression: string;
  avgTensionScore: number;
  lightingQuality: string;
  backgroundQuality: string;
}

export interface ICameraAnalysis {
  interviewId: string;
  questionIndex: number;
  frames: ICameraFrame[];
  aggregated: IAggregatedCameraMetrics;
  consentId: string;
  createdAt: Date;
}

export interface ICameraConsent {
  id: string;
  userId: string;
  interviewId: string;
  granted: boolean;
  ipAddress?: string;
  grantedAt: Date;
}
