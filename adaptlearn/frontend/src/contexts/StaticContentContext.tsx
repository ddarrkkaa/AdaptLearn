import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import client from "../api/client";

export interface PrefOption {
  l: string;
  v: string;
}
export interface PrefQuestion {
  text: string;
  key: string;
  opts: PrefOption[];
}
export interface CareerOption {
  t: string;
  tp: string;
}
export interface CareerQuestion {
  t: string;
  opts: CareerOption[];
}
export interface CareerResultInfo {
  title: string;
  desc: string;
  color: string;
  profs: string[];
}
export interface ClassInfo {
  id: number;
  name: string;
  grade: number;
}
export interface StudentInfo {
  id: number;
  name: string;
  classId: number;
  className: string;
}

export const NON_HOBBY_KEYS: ReadonlySet<string> = new Set([
  "auditory",
  "visual",
  "kinesthetic",
  "reading",
  "stem",
  "humanities",
  "arts",
  "nature",
  "slow",
  "medium",
  "fast",
  "dedicated",
  "mastery",
  "grades",
  "exam",
  "growth",
  "quiet",
  "music",
  "social",
  "flexible",
  "art",
  "sport",
  "tech",
]);

export interface StaticContent {
  prefs: PrefQuestion[];
  hobbies: string[];
  career: CareerQuestion[];
  careerResults: Record<string, CareerResultInfo>;
  trackLabels: Record<string, string>;
  subjectToTrack: Record<string, { track: string; subj: string }>;
  classes: ClassInfo[];
  classMap: Record<number, ClassInfo>;
  allStudents: StudentInfo[];
  loaded: boolean;
}

const empty: StaticContent = {
  prefs: [],
  hobbies: [],
  career: [],
  careerResults: {},
  trackLabels: {},
  subjectToTrack: {},
  classes: [],
  classMap: {},
  allStudents: [],
  loaded: false,
};

const Ctx = createContext<StaticContent>(empty);

export function StaticContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<StaticContent>(empty);

  useEffect(() => {
    Promise.all([
      client
        .get("/api/preferences/questions")
        .then((r) => r.data)
        .catch(() => []),
      client
        .get("/api/preferences/hobbies")
        .then((r) => r.data)
        .catch(() => []),
      client
        .get("/api/career/questions")
        .then((r) => r.data)
        .catch(() => []),
      client
        .get("/api/career/results")
        .then((r) => r.data)
        .catch(() => ({})),
      client
        .get("/api/career/track-labels")
        .then((r) => r.data)
        .catch(() => ({})),
      client
        .get("/api/career/subject-tracks")
        .then((r) => r.data)
        .catch(() => ({})),
      client
        .get("/api/admin/classes")
        .then((r) => r.data)
        .catch(() => []),
      client
        .get("/api/admin/users")
        .then((r) => r.data)
        .catch(() => []),
    ]).then(
      ([
        prefs,
        hobbies,
        career,
        careerResults,
        trackLabels,
        subjectToTrack,
        classes,
        users,
      ]) => {
        const classMap: Record<number, ClassInfo> = {};
        (classes ?? []).forEach((c: ClassInfo) => {
          classMap[c.id] = c;
        });
        const allStudents: StudentInfo[] = (users ?? [])
          .filter(
            (u: any) => u.role === "student" && u.student_id && u.class_id,
          )
          .map((u: any) => ({
            id: u.student_id,
            name: u.full_name,
            classId: u.class_id,
            className: classMap[u.class_id]?.name ?? `Клас ${u.class_id}`,
          }));
        setContent({
          prefs,
          hobbies,
          career,
          careerResults,
          trackLabels,
          subjectToTrack,
          classes,
          classMap,
          allStudents,
          loaded: true,
        });
      },
    );
  }, []);

  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

export const useStaticContent = () => useContext(Ctx);
