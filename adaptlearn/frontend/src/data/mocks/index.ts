import lessonAnalytics from "./lessonAnalytics.json";

export interface MockLessonAnalytics {
  has_data: boolean;
  total_submissions: number;
  average_score: number;
  average_grade_12: number;
  distribution: Record<string, number>;
  best: number;
  worst: number;
  aiSummary: string;
  topSkills: { name: string; level: number }[];
  commonErrors: string[];
}

export const MOCK_LESSON_ANALYTICS = lessonAnalytics as unknown as Record<
  string,
  MockLessonAnalytics
>;
