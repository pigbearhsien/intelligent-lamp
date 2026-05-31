export type Subject = '國文' | '英文' | '數學' | '物理' | '化學' | '生物' | '歷史' | '地理' | '公民' | '其他';

export const SUBJECTS: Subject[] = ['國文', '英文', '數學', '物理', '化學', '生物', '歷史', '地理', '公民', '其他'];

export interface StudySession {
  id: string;
  subject: Subject;
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  durationMinutes: number;
  focusScore: number;
}

export interface Exam {
  id: string;
  examDate: string;
  subject: Subject;
  examName: string;
  myScore: number | null;
}

export interface EnvironmentReading {
  date: string;
  temperature: number;
  humidity: number;
  brightness: number;
}
