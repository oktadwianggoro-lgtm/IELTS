import {
  BarChart3,
  BookMarked,
  BookOpenCheck,
  CalendarClock,
  ClipboardList,
  Compass,
  Headphones,
  Home,
  Info,
  Languages,
  Mic,
  NotebookPen,
  PenSquare,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "./i18n/dictionary";

export type NavKey = keyof Dictionary["nav"];

export type NavItem = {
  href: string;
  key: NavKey;
  icon: LucideIcon;
  /** Set once the matching Fase ships real content; used by the coming-soon stub. */
  plannedPhase?: string;
};

export type NavGroup = {
  key: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    key: "main",
    items: [
      { href: "/dashboard", key: "dashboard", icon: Home },
      { href: "/mulai-dari-sini", key: "startHere", icon: Compass },
    ],
  },
  {
    key: "learn",
    items: [
      { href: "/jalur-belajar", key: "learningPath", icon: BookOpenCheck, plannedPhase: "Fase 3" },
      { href: "/materi", key: "materials", icon: NotebookPen, plannedPhase: "Fase 3" },
      { href: "/latihan-harian", key: "dailyPractice", icon: ClipboardList },
      {
        href: "/grammar-vocabulary",
        key: "grammarVocabulary",
        icon: Languages,
        plannedPhase: "Fase 3",
      },
    ],
  },
  {
    key: "lab",
    items: [
      { href: "/listening-lab", key: "listeningLab", icon: Headphones },
      { href: "/reading-lab", key: "readingLab", icon: BookMarked },
      { href: "/writing-lab", key: "writingLab", icon: PenSquare },
      { href: "/speaking-lab", key: "speakingLab", icon: Mic },
    ],
  },
  {
    key: "exam",
    items: [
      { href: "/tryout", key: "tryout", icon: ClipboardList },
      { href: "/buku-kesalahan", key: "mistakeBook", icon: BookMarked },
    ],
  },
  {
    key: "planning",
    items: [
      { href: "/rencana-belajar", key: "studyPlan", icon: CalendarClock },
      { href: "/progress", key: "progress", icon: BarChart3 },
    ],
  },
  {
    key: "other",
    items: [
      { href: "/info-ielts", key: "infoIelts", icon: Info, plannedPhase: "Fase 14" },
      { href: "/profil", key: "profile", icon: UserRound, plannedPhase: "Fase 1" },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

/** Primary items shown directly in the mobile bottom bar; the rest live in the "More" sheet. */
export const mobilePrimaryHrefs = ["/dashboard", "/jalur-belajar", "/latihan-harian", "/tryout"];
