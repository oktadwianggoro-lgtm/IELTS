export type Locale = "id" | "en";

export const locales: Locale[] = ["id", "en"];
export const defaultLocale: Locale = "id";
export const LOCALE_COOKIE = "locale";

export interface Dictionary {
  brand: { name: string; tagline: string };
  nav: {
    dashboard: string;
    startHere: string;
    learningPath: string;
    materials: string;
    dailyPractice: string;
    listeningLab: string;
    readingLab: string;
    writingLab: string;
    speakingLab: string;
    grammarVocabulary: string;
    tryout: string;
    mistakeBook: string;
    studyPlan: string;
    progress: string;
    infoIelts: string;
    profile: string;
    more: string;
  };
  common: {
    comingSoonBadge: string;
    comingSoonTitle: string;
    comingSoonBody: string;
    comingSoonPlan: string;
    backToDashboard: string;
    learnMore: string;
    startLearning: string;
    viewAll: string;
    noDataYet: string;
    language: string;
    theme: string;
  };
  disclaimer: string;
  landing: {
    heroEyebrow: string;
    heroTitle: string;
    heroBody: string;
    ctaPrimary: string;
    ctaSecondary: string;
    skillsTitle: string;
    skillsBody: string;
    skills: { title: string; body: string }[];
    pathTitle: string;
    pathBody: string;
    honestyTitle: string;
    honestyBody: string;
  };
  dashboard: {
    welcomeTitle: string;
    welcomeBody: string;
    todayPlanTitle: string;
    todayPlanEmpty: string;
    progressTitle: string;
    progressEmpty: string;
    activityTitle: string;
    activityEmpty: string;
    nextStepTitle: string;
    nextStepBody: string;
  };
}

export const dictionary: Record<Locale, Dictionary> = {
  id: {
    brand: {
      name: "Success IELTS",
      tagline: "Belajar Cerdas. Latihan Terarah. Raih Target IELTS Anda.",
    },
    nav: {
      dashboard: "Beranda",
      startHere: "Mulai dari Sini",
      learningPath: "Jalur Belajar",
      materials: "Materi",
      dailyPractice: "Latihan Harian",
      listeningLab: "Listening Lab",
      readingLab: "Reading Lab",
      writingLab: "Writing Lab",
      speakingLab: "Speaking Lab",
      grammarVocabulary: "Grammar & Vocabulary",
      tryout: "Tryout IELTS",
      mistakeBook: "Buku Kesalahan",
      studyPlan: "Rencana Belajar",
      progress: "Progress & Laporan",
      infoIelts: "Info IELTS",
      profile: "Profil & Langganan",
      more: "Lainnya",
    },
    common: {
      comingSoonBadge: "Segera tersedia",
      comingSoonTitle: "Fitur ini sedang dibangun",
      comingSoonBody:
        "Bagian ini belum tersedia karena kontennya belum dibuat dan divalidasi. Kami tidak menampilkan data atau soal yang belum siap agar Anda tidak belajar dari materi yang belum teruji.",
      comingSoonPlan: "Direncanakan pada",
      backToDashboard: "Kembali ke Beranda",
      learnMore: "Pelajari Lebih Lanjut",
      startLearning: "Mulai Belajar",
      viewAll: "Lihat semua",
      noDataYet: "Belum ada data",
      language: "Bahasa",
      theme: "Tema",
    },
    disclaimer:
      "Success IELTS adalah platform belajar independen dan bukan penyelenggara atau mitra resmi IELTS. Semua soal latihan di aplikasi ini bersifat orisinal. Skor dan feedback otomatis merupakan estimasi untuk pembelajaran, bukan hasil resmi IELTS. Verifikasi format, biaya, kebijakan, dan persyaratan band pada sumber resmi serta institusi tujuan Anda.",
    landing: {
      heroEyebrow: "Platform belajar IELTS dari dasar hingga mahir",
      heroTitle: "Satu jalur belajar lengkap untuk persiapan IELTS Anda",
      heroBody:
        "Success IELTS menggabungkan pembelajaran bertahap — dari dasar bahasa Inggris hingga strategi ujian tingkat lanjut — dengan latihan Listening, Reading, Writing, dan Speaking yang terstruktur dan terukur.",
      ctaPrimary: "Mulai Belajar Gratis",
      ctaSecondary: "Lihat Info IELTS",
      skillsTitle: "Dibangun untuk empat keterampilan IELTS",
      skillsBody:
        "Lengkap dengan Grammar, Vocabulary, Pronunciation, dan strategi ujian — bukan sekadar kumpulan tryout.",
      skills: [
        {
          title: "Listening Lab",
          body: "Audio latihan orisinal dengan transcript dan analisis kesalahan setelah menjawab.",
        },
        {
          title: "Reading Lab",
          body: "Passage orisinal dengan berbagai tipe soal dan bukti jawaban dari teks.",
        },
        {
          title: "Writing Lab",
          body: "Task 1 & Task 2 dengan rubric feedback empat kriteria dan riwayat draft.",
        },
        {
          title: "Speaking Lab",
          body: "Latihan Part 1–3 dengan timer, rekaman opsional, dan self-review.",
        },
      ],
      pathTitle: "Jalur belajar berjenjang, bukan tebakan",
      pathBody:
        "Dari Starter/Pre-A1 untuk pemula absolut hingga enrichment Band 7.5–9, lengkap dengan diagnostic test dan rencana belajar personal.",
      honestyTitle: "Progress yang jujur",
      honestyBody:
        "Tidak ada statistik palsu, leaderboard paksa, atau klaim band yang dijamin. Setiap estimasi diberi label jelas sebagai estimasi pembelajaran.",
    },
    dashboard: {
      welcomeTitle: "Selamat datang di Success IELTS",
      welcomeBody:
        "Kerjakan diagnostic test untuk mendapat estimasi level awal dan rencana belajar personal, lalu lanjutkan lewat Jalur Belajar atau Materi.",
      todayPlanTitle: "Rencana hari ini",
      todayPlanEmpty:
        "Belum ada rencana belajar aktif. Kerjakan diagnostic test di Mulai dari Sini untuk membuat rencana belajar personal.",
      progressTitle: "Progress kurikulum",
      progressEmpty: "Belum ada progress untuk ditampilkan.",
      activityTitle: "Aktivitas terakhir",
      activityEmpty: "Belum ada aktivitas belajar yang tercatat.",
      nextStepTitle: "Langkah berikutnya",
      nextStepBody:
        "Lengkapi onboarding agar rekomendasi belajar didasarkan pada tujuan dan preferensi Anda, lalu kerjakan diagnostic test.",
    },
  },
  en: {
    brand: {
      name: "Success IELTS",
      tagline: "Learn Smart. Practice with Purpose. Achieve Your IELTS Goal.",
    },
    nav: {
      dashboard: "Home",
      startHere: "Start Here",
      learningPath: "Learning Path",
      materials: "Materials",
      dailyPractice: "Daily Practice",
      listeningLab: "Listening Lab",
      readingLab: "Reading Lab",
      writingLab: "Writing Lab",
      speakingLab: "Speaking Lab",
      grammarVocabulary: "Grammar & Vocabulary",
      tryout: "IELTS Tryout",
      mistakeBook: "Mistake Book",
      studyPlan: "Study Plan",
      progress: "Progress & Reports",
      infoIelts: "IELTS Info",
      profile: "Profile & Subscription",
      more: "More",
    },
    common: {
      comingSoonBadge: "Coming soon",
      comingSoonTitle: "This feature is under construction",
      comingSoonBody:
        "This section isn't available yet because its content hasn't been created and validated. We don't show data or questions that aren't ready, so you never learn from unvetted material.",
      comingSoonPlan: "Planned for",
      backToDashboard: "Back to Home",
      learnMore: "Learn More",
      startLearning: "Start Learning",
      viewAll: "View all",
      noDataYet: "No data yet",
      language: "Language",
      theme: "Theme",
    },
    disclaimer:
      "Success IELTS is an independent learning platform and is not an official IELTS test administrator or partner. All practice questions in this app are original. Automated scores and feedback are learning estimates, not official IELTS results. Verify format, fees, policies, and band requirements with official sources and your destination institution.",
    landing: {
      heroEyebrow: "An IELTS learning platform from basics to mastery",
      heroTitle: "One complete learning path for your IELTS preparation",
      heroBody:
        "Success IELTS combines a step-by-step English foundation — from the basics to advanced exam strategy — with structured, measurable Listening, Reading, Writing, and Speaking practice.",
      ctaPrimary: "Start Learning Free",
      ctaSecondary: "See IELTS Info",
      skillsTitle: "Built for all four IELTS skills",
      skillsBody:
        "Complete with Grammar, Vocabulary, Pronunciation, and exam strategy — not just a pile of practice tests.",
      skills: [
        {
          title: "Listening Lab",
          body: "Original practice audio with transcripts and mistake analysis after you answer.",
        },
        {
          title: "Reading Lab",
          body: "Original passages with varied question types and in-text evidence for every answer.",
        },
        {
          title: "Writing Lab",
          body: "Task 1 & Task 2 with four-criteria rubric feedback and draft history.",
        },
        {
          title: "Speaking Lab",
          body: "Part 1–3 practice with timers, optional recording, and self-review.",
        },
      ],
      pathTitle: "A staged learning path, not guesswork",
      pathBody:
        "From Starter/Pre-A1 for absolute beginners to Band 7.5–9 enrichment, with a diagnostic test and a personal study plan.",
      honestyTitle: "Honest progress",
      honestyBody:
        "No fake statistics, forced leaderboards, or guaranteed-band claims. Every estimate is clearly labelled as a learning estimate.",
    },
    dashboard: {
      welcomeTitle: "Welcome to Success IELTS",
      welcomeBody:
        "Take the diagnostic test to get an initial level estimate and a personal study plan, then continue through Learning Path or Materials.",
      todayPlanTitle: "Today's plan",
      todayPlanEmpty:
        "No active study plan yet. Take the diagnostic test under Start Here to generate a personal study plan.",
      progressTitle: "Curriculum progress",
      progressEmpty: "No progress to show yet.",
      activityTitle: "Recent activity",
      activityEmpty: "No learning activity recorded yet.",
      nextStepTitle: "Next step",
      nextStepBody:
        "Complete onboarding so recommendations are based on your goals and preferences, then take the diagnostic test.",
    },
  },
};
