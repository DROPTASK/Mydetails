/**
 * CBSE Class 12 Strategy Builder Data Model & Utilities
 * Comprehensive database of CBSE Class 12 Syllabus (PCM, PCB, CS, Commerce, Arts)
 * with official curriculum references, marks weightage, day types, and backlog engine.
 */

export type DayType = "working" | "holiday" | "self_leave";

export interface SubjectChapter {
  id: string;
  subjectId: string;
  name: string;
  unit: string;
  weightageMarks?: number;
  estHours: number;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
}

export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  stream: "Science" | "Commerce" | "Humanities" | "Common";
  color: string;
  bgLight: string;
  icon: string;
  totalTheoryMarks: number;
  practicalMarks: number;
  officialPdfUrl: string;
  chapters: SubjectChapter[];
}

export interface PlanChapterTask {
  id: string;
  subjectId: string;
  chapterId: string;
  chapterName: string;
  subjectName: string;
  taskType: "Theory" | "NCERT Exercises" | "PYQs" | "Revision" | "Sample Paper";
  estHours: number;
  completed: boolean;
  notes?: string;
}

export interface PlanDay {
  date: string; // YYYY-MM-DD
  dayType: DayType;
  label?: string; // e.g. "Diwali Break", "School Physics Pre-board"
  targetStudyHours: number;
  tasks: PlanChapterTask[];
}

export interface StrategyPlan {
  id: string;
  title: string;
  studentName: string;
  stream: string;
  startDate: string; // YYYY-MM-DD
  targetEndDate: string; // YYYY-MM-DD
  selectedSubjectIds: string[];
  days: PlanDay[];
  createdAt: number;
  updatedAt: number;
}

export interface SyllabusProgressItem {
  conceptDone: boolean;
  ncertDone: boolean;
  pyqsDone: boolean;
  revisionDone: boolean;
}

// Master CBSE Class 12 Syllabus Data (Aligned with Latest CBSE Curriculum)
export const CBSE_12TH_SUBJECTS: SubjectInfo[] = [
  {
    id: "physics",
    name: "Physics",
    code: "042",
    stream: "Science",
    color: "#3b82f6",
    bgLight: "rgba(59, 130, 246, 0.12)",
    icon: "⚡",
    totalTheoryMarks: 70,
    practicalMarks: 30,
    officialPdfUrl: "https://cbseacademic.nic.in/curriculum_2025.html",
    chapters: [
      {
        id: "phy-1",
        subjectId: "physics",
        name: "Electric Charges and Fields",
        unit: "Unit I: Electrostatics",
        weightageMarks: 8,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Coulomb's Law", "Electric Field & Dipole", "Gauss's Theorem & Applications"],
      },
      {
        id: "phy-2",
        subjectId: "physics",
        name: "Electrostatic Potential and Capacitance",
        unit: "Unit I: Electrostatics",
        weightageMarks: 8,
        estHours: 7,
        difficulty: "Hard",
        topics: ["Electric Potential", "Equipotential Surfaces", "Capacitors in Series/Parallel", "Dielectrics"],
      },
      {
        id: "phy-3",
        subjectId: "physics",
        name: "Current Electricity",
        unit: "Unit II: Current Electricity",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Drift Velocity & Ohm's Law", "Kirchhoff's Rules", "Wheatstone Bridge"],
      },
      {
        id: "phy-4",
        subjectId: "physics",
        name: "Moving Charges and Magnetism",
        unit: "Unit III: Magnetic Effects of Current",
        weightageMarks: 9,
        estHours: 7,
        difficulty: "Hard",
        topics: ["Biot-Savart Law", "Ampere's Circuital Law", "Torque on Current Loop", "Moving Coil Galvanometer"],
      },
      {
        id: "phy-5",
        subjectId: "physics",
        name: "Magnetism and Matter",
        unit: "Unit III: Magnetism & Matter",
        weightageMarks: 4,
        estHours: 4,
        difficulty: "Easy",
        topics: ["Bar Magnet as Dipole", "Magnetic Field Lines", "Dia-, Para- and Ferromagnetism"],
      },
      {
        id: "phy-6",
        subjectId: "physics",
        name: "Electromagnetic Induction",
        unit: "Unit IV: EMI and AC",
        weightageMarks: 5,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Faraday's Laws", "Lenz's Law", "Self & Mutual Inductance"],
      },
      {
        id: "phy-7",
        subjectId: "physics",
        name: "Alternating Current",
        unit: "Unit IV: EMI and AC",
        weightageMarks: 6,
        estHours: 6,
        difficulty: "Hard",
        topics: ["LCR Series Circuit & Resonance", "Power in AC Circuits", "AC Generator & Transformer"],
      },
      {
        id: "phy-8",
        subjectId: "physics",
        name: "Electromagnetic Waves",
        unit: "Unit V: Electromagnetic Waves",
        weightageMarks: 3,
        estHours: 3,
        difficulty: "Easy",
        topics: ["Displacement Current", "EM Spectrum & Characteristics"],
      },
      {
        id: "phy-9",
        subjectId: "physics",
        name: "Ray Optics and Optical Instruments",
        unit: "Unit VI: Optics",
        weightageMarks: 10,
        estHours: 8,
        difficulty: "Hard",
        topics: ["Total Internal Reflection", "Lens Maker's Formula", "Prism Dispersion", "Astronomical Telescope & Microscope"],
      },
      {
        id: "phy-10",
        subjectId: "physics",
        name: "Wave Optics",
        unit: "Unit VI: Optics",
        weightageMarks: 8,
        estHours: 6,
        difficulty: "Hard",
        topics: ["Huygens' Principle", "Young's Double Slit Interference", "Single Slit Diffraction"],
      },
      {
        id: "phy-11",
        subjectId: "physics",
        name: "Dual Nature of Radiation and Matter",
        unit: "Unit VII: Dual Nature",
        weightageMarks: 5,
        estHours: 4,
        difficulty: "Medium",
        topics: ["Photoelectric Effect", "Einstein's Equation", "de-Broglie Wavelength"],
      },
      {
        id: "phy-12",
        subjectId: "physics",
        name: "Atoms",
        unit: "Unit VIII: Atoms & Nuclei",
        weightageMarks: 4,
        estHours: 4,
        difficulty: "Easy",
        topics: ["Rutherford Model", "Bohr Postulates & Hydrogen Spectrum"],
      },
      {
        id: "phy-13",
        subjectId: "physics",
        name: "Nuclei",
        unit: "Unit VIII: Atoms & Nuclei",
        weightageMarks: 4,
        estHours: 4,
        difficulty: "Medium",
        topics: ["Nuclear Density", "Mass Defect & Binding Energy", "Nuclear Fission & Fusion"],
      },
      {
        id: "phy-14",
        subjectId: "physics",
        name: "Semiconductor Electronics",
        unit: "Unit IX: Electronic Devices",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Energy Bands", "p-n Junction Diode", "Half & Full Wave Rectifiers"],
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    code: "043",
    stream: "Science",
    color: "#10b981",
    bgLight: "rgba(16, 185, 129, 0.12)",
    icon: "🧪",
    totalTheoryMarks: 70,
    practicalMarks: 30,
    officialPdfUrl: "https://cbseacademic.nic.in/curriculum_2025.html",
    chapters: [
      {
        id: "chem-1",
        subjectId: "chemistry",
        name: "Solutions",
        unit: "Physical Chemistry",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Raoult's Law", "Colligative Properties", "Van't Hoff Factor"],
      },
      {
        id: "chem-2",
        subjectId: "chemistry",
        name: "Electrochemistry",
        unit: "Physical Chemistry",
        weightageMarks: 9,
        estHours: 7,
        difficulty: "Hard",
        topics: ["Nernst Equation", "Kohlrausch Law", "Electrolysis & Batteries", "Fuel Cells"],
      },
      {
        id: "chem-3",
        subjectId: "chemistry",
        name: "Chemical Kinetics",
        unit: "Physical Chemistry",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Rate Law & Order", "Integrated Rate Equations", "Arrhenius Equation"],
      },
      {
        id: "chem-4",
        subjectId: "chemistry",
        name: "d and f Block Elements",
        unit: "Inorganic Chemistry",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Electronic Configurations", "KMnO4 & K2Cr2O7 Reactions", "Lanthanoid Contraction"],
      },
      {
        id: "chem-5",
        subjectId: "chemistry",
        name: "Coordination Compounds",
        unit: "Inorganic Chemistry",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Hard",
        topics: ["IUPAC Nomenclature", "Werner's Theory", "Valence Bond & Crystal Field Theory"],
      },
      {
        id: "chem-6",
        subjectId: "chemistry",
        name: "Haloalkanes and Haloarenes",
        unit: "Organic Chemistry",
        weightageMarks: 6,
        estHours: 6,
        difficulty: "Medium",
        topics: ["SN1 vs SN2 Mechanisms", "Optical Activity", "Electrophilic Substitution in Haloarenes"],
      },
      {
        id: "chem-7",
        subjectId: "chemistry",
        name: "Alcohols, Phenols and Ethers",
        unit: "Organic Chemistry",
        weightageMarks: 6,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Preparation & Acidity of Phenols", "Reimer-Tiemann & Kolbe Reactions", "Williamson Synthesis"],
      },
      {
        id: "chem-8",
        subjectId: "chemistry",
        name: "Aldehydes, Ketones and Carboxylic Acids",
        unit: "Organic Chemistry",
        weightageMarks: 8,
        estHours: 8,
        difficulty: "Hard",
        topics: ["Nucleophilic Addition", "Aldol & Cannizzaro Reactions", "HVZ Reaction & Acidity of Acids"],
      },
      {
        id: "chem-9",
        subjectId: "chemistry",
        name: "Amines",
        unit: "Organic Chemistry",
        weightageMarks: 6,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Hoffmann Bromamide", "Carbylamine Reaction", "Diazonium Salts & Sandmeyer"],
      },
      {
        id: "chem-10",
        subjectId: "chemistry",
        name: "Biomolecules",
        unit: "Organic Chemistry",
        weightageMarks: 7,
        estHours: 5,
        difficulty: "Easy",
        topics: ["Glucose Structures", "Peptide Linkage & Proteins", "Nucleic Acids DNA/RNA"],
      },
    ],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    code: "041",
    stream: "Science",
    color: "#f59e0b",
    bgLight: "rgba(245, 158, 11, 0.12)",
    icon: "📐",
    totalTheoryMarks: 80,
    practicalMarks: 20,
    officialPdfUrl: "https://cbseacademic.nic.in/curriculum_2025.html",
    chapters: [
      {
        id: "math-1",
        subjectId: "mathematics",
        name: "Relations and Functions",
        unit: "Unit I: Relations & Functions",
        weightageMarks: 4,
        estHours: 4,
        difficulty: "Medium",
        topics: ["Equivalence Relations", "One-one & Onto Functions"],
      },
      {
        id: "math-2",
        subjectId: "mathematics",
        name: "Inverse Trigonometric Functions",
        unit: "Unit I: Relations & Functions",
        weightageMarks: 4,
        estHours: 4,
        difficulty: "Medium",
        topics: ["Principal Value Branches", "Domain & Range Graphs"],
      },
      {
        id: "math-3",
        subjectId: "mathematics",
        name: "Matrices",
        unit: "Unit II: Algebra",
        weightageMarks: 5,
        estHours: 4,
        difficulty: "Easy",
        topics: ["Operations on Matrices", "Transpose & Symmetric Matrices"],
      },
      {
        id: "math-4",
        subjectId: "mathematics",
        name: "Determinants",
        unit: "Unit II: Algebra",
        weightageMarks: 5,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Adjoint & Inverse of Matrix", "Solving Linear Equations using Inverse"],
      },
      {
        id: "math-5",
        subjectId: "mathematics",
        name: "Continuity and Differentiability",
        unit: "Unit III: Calculus",
        weightageMarks: 9,
        estHours: 7,
        difficulty: "Hard",
        topics: ["Continuity at a Point", "Chain Rule", "Logarithmic Differentiation", "Parametric Forms"],
      },
      {
        id: "math-6",
        subjectId: "mathematics",
        name: "Application of Derivatives (AOD)",
        unit: "Unit III: Calculus",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Hard",
        topics: ["Increasing & Decreasing Functions", "Maxima & Minima Word Problems"],
      },
      {
        id: "math-7",
        subjectId: "mathematics",
        name: "Integrals",
        unit: "Unit III: Calculus",
        weightageMarks: 9,
        estHours: 8,
        difficulty: "Hard",
        topics: ["Substitution & By Parts", "Partial Fractions", "Definite Integral Properties"],
      },
      {
        id: "math-8",
        subjectId: "mathematics",
        name: "Application of Integrals (AOI)",
        unit: "Unit III: Calculus",
        weightageMarks: 5,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Area Under Simple Curves (Lines, Parabolas, Circles, Ellipses)"],
      },
      {
        id: "math-9",
        subjectId: "mathematics",
        name: "Differential Equations",
        unit: "Unit III: Calculus",
        weightageMarks: 5,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Separable Variables", "Homogeneous Equations", "Linear Differential Equations"],
      },
      {
        id: "math-10",
        subjectId: "mathematics",
        name: "Vector Algebra",
        unit: "Unit IV: Vectors & 3-D",
        weightageMarks: 7,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Dot & Cross Product", "Direction Cosines", "Scalar Projections"],
      },
      {
        id: "math-11",
        subjectId: "mathematics",
        name: "Three Dimensional Geometry (3D)",
        unit: "Unit IV: Vectors & 3-D",
        weightageMarks: 7,
        estHours: 6,
        difficulty: "Hard",
        topics: ["Equation of Line in Space", "Shortest Distance Between Skew Lines"],
      },
      {
        id: "math-12",
        subjectId: "mathematics",
        name: "Linear Programming",
        unit: "Unit V: Linear Programming",
        weightageMarks: 5,
        estHours: 3,
        difficulty: "Easy",
        topics: ["Corner Point Method", "Feasible Region Optimization"],
      },
      {
        id: "math-13",
        subjectId: "mathematics",
        name: "Probability",
        unit: "Unit VI: Probability",
        weightageMarks: 8,
        estHours: 6,
        difficulty: "Hard",
        topics: ["Conditional Probability", "Multiplication Theorem", "Bayes' Theorem"],
      },
    ],
  },
  {
    id: "cs",
    name: "Computer Science",
    code: "083",
    stream: "Science",
    color: "#8b5cf6",
    bgLight: "rgba(139, 92, 246, 0.12)",
    icon: "💻",
    totalTheoryMarks: 70,
    practicalMarks: 30,
    officialPdfUrl: "https://cbseacademic.nic.in/curriculum_2025.html",
    chapters: [
      {
        id: "cs-1",
        subjectId: "cs",
        name: "Python Revision Tour & Functions",
        unit: "Unit I: Computational Thinking",
        weightageMarks: 10,
        estHours: 5,
        difficulty: "Easy",
        topics: ["Strings, Lists, Tuples, Dictionaries", "Scope of Variables", "Positional & Default Arguments"],
      },
      {
        id: "cs-2",
        subjectId: "cs",
        name: "File Handling (Text, Binary, CSV)",
        unit: "Unit I: Computational Thinking",
        weightageMarks: 15,
        estHours: 7,
        difficulty: "Medium",
        topics: ["read(), readline(), readlines()", "pickle module: dump() & load()", "csv.reader() & csv.writer()"],
      },
      {
        id: "cs-3",
        subjectId: "cs",
        name: "Data Structure: Linear Stack",
        unit: "Unit I: Computational Thinking",
        weightageMarks: 15,
        estHours: 5,
        difficulty: "Medium",
        topics: ["LIFO Principle", "Push & Pop Operations in Python Lists"],
      },
      {
        id: "cs-4",
        subjectId: "cs",
        name: "Computer Networks",
        unit: "Unit II: Computer Networks",
        weightageMarks: 10,
        estHours: 6,
        difficulty: "Easy",
        topics: ["Transmission Media (Twisted pair, Coax, Fiber)", "Topologies & Network Devices", "Case Study Layout Design"],
      },
      {
        id: "cs-5",
        subjectId: "cs",
        name: "Database Management & SQL",
        unit: "Unit III: Database Management",
        weightageMarks: 15,
        estHours: 7,
        difficulty: "Medium",
        topics: ["DDL vs DML", "Aggregate Functions & GROUP BY / HAVING", "Cartesian Product & Equi-Join"],
      },
      {
        id: "cs-6",
        subjectId: "cs",
        name: "Python-SQL Database Connectivity",
        unit: "Unit III: Database Management",
        weightageMarks: 5,
        estHours: 4,
        difficulty: "Medium",
        topics: ["mysql.connector", "cursor(), execute(), fetchall()", "commit()"],
      },
    ],
  },
  {
    id: "english",
    name: "English Core",
    code: "301",
    stream: "Common",
    color: "#ec4899",
    bgLight: "rgba(236, 72, 153, 0.12)",
    icon: "📖",
    totalTheoryMarks: 80,
    practicalMarks: 20,
    officialPdfUrl: "https://cbseacademic.nic.in/curriculum_2025.html",
    chapters: [
      {
        id: "eng-1",
        subjectId: "english",
        name: "Reading Skills & Note Making",
        unit: "Section A: Reading",
        weightageMarks: 22,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Unseen Discursive Passage", "Case-based Passage"],
      },
      {
        id: "eng-2",
        subjectId: "english",
        name: "Creative Writing Skills",
        unit: "Section B: Writing",
        weightageMarks: 18,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Notice Writing", "Formal/Informal Invitations", "Letters of Application for Job", "Article & Report Writing"],
      },
      {
        id: "eng-3",
        subjectId: "english",
        name: "Flamingo: Prose Masteries",
        unit: "Section C: Literature",
        weightageMarks: 20,
        estHours: 7,
        difficulty: "Easy",
        topics: ["The Last Lesson", "Lost Spring", "Deep Water", "The Rattrap", "Indigo", "Poets and Pancakes", "The Interview", "Going Places"],
      },
      {
        id: "eng-4",
        subjectId: "english",
        name: "Flamingo: Poetry Anthology",
        unit: "Section C: Literature",
        weightageMarks: 10,
        estHours: 5,
        difficulty: "Easy",
        topics: ["My Mother at Sixty-Six", "Keeping Quiet", "A Thing of Beauty", "A Roadside Stand", "Aunt Jennifer's Tigers"],
      },
      {
        id: "eng-5",
        subjectId: "english",
        name: "Vistas: Supplementary Reader",
        unit: "Section C: Literature",
        weightageMarks: 10,
        estHours: 6,
        difficulty: "Easy",
        topics: ["The Third Level", "The Tiger King", "Journey to the end of the Earth", "The Enemy", "On the face of It", "Memories of Childhood"],
      },
    ],
  },
  {
    id: "biology",
    name: "Biology",
    code: "044",
    stream: "Science",
    color: "#06b6d4",
    bgLight: "rgba(6, 182, 212, 0.12)",
    icon: "🌱",
    totalTheoryMarks: 70,
    practicalMarks: 30,
    officialPdfUrl: "https://cbseacademic.nic.in/curriculum_2025.html",
    chapters: [
      {
        id: "bio-1",
        subjectId: "biology",
        name: "Sexual Reproduction in Flowering Plants",
        unit: "Unit VI: Reproduction",
        weightageMarks: 8,
        estHours: 5,
        difficulty: "Medium",
        topics: ["Microsporogenesis", "Megasporogenesis", "Double Fertilization"],
      },
      {
        id: "bio-2",
        subjectId: "biology",
        name: "Human Reproduction & Reproductive Health",
        unit: "Unit VI: Reproduction",
        weightageMarks: 8,
        estHours: 6,
        difficulty: "Medium",
        topics: ["Male/Female Reproductive Systems", "Gametogenesis", "Menstrual Cycle", "IVF & ART"],
      },
      {
        id: "bio-3",
        subjectId: "biology",
        name: "Principles of Inheritance and Variation",
        unit: "Unit VII: Genetics",
        weightageMarks: 10,
        estHours: 7,
        difficulty: "Hard",
        topics: ["Mendelian Genetics", "Linkage & Recombination", "Sex Determination", "Pedigree Analysis"],
      },
      {
        id: "bio-4",
        subjectId: "biology",
        name: "Molecular Basis of Inheritance",
        unit: "Unit VII: Genetics",
        weightageMarks: 10,
        estHours: 7,
        difficulty: "Hard",
        topics: ["DNA Replication", "Transcription & Translation", "Lac Operon", "Human Genome Project"],
      },
      {
        id: "bio-5",
        subjectId: "biology",
        name: "Biotechnology: Principles & Applications",
        unit: "Unit IX: Biotechnology",
        weightageMarks: 12,
        estHours: 6,
        difficulty: "Medium",
        topics: ["rDNA Technology", "Cloning Vectors", "PCR", "Bt Cotton & Gene Therapy"],
      },
      {
        id: "bio-6",
        subjectId: "biology",
        name: "Ecology and Environment",
        unit: "Unit X: Ecology",
        weightageMarks: 10,
        estHours: 6,
        difficulty: "Easy",
        topics: ["Organisms and Populations", "Ecosystem Energy Flow", "Biodiversity & Conservation"],
      },
    ],
  },
];

// Helper to format date string to friendly format e.g. "Mon, 12 Oct"
export function formatFriendlyDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

// Helper to format date with year e.g. "15 Feb 2026"
export function formatLongDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Add days to ISO date string (YYYY-MM-DD)
export function addDaysToDate(dateStr: string, numDays: number): string {
  try {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + numDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return dateStr;
  }
}

// Get day of week (0 = Sunday, 6 = Saturday)
export function getDayOfWeek(dateStr: string): number {
  try {
    const parts = dateStr.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay();
  } catch {
    return 1;
  }
}

// Today ISO string
export function getTodayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Calculate Backlog & Dynamic End Date Adjustment
export interface BacklogAnalysis {
  backlogTasksCount: number;
  backlogDays: number; // 1 day backlog = 1 day increased
  totalTasksCount: number;
  completedTasksCount: number;
  completionRatePercent: number;
  originalEndDate: string;
  adjustedEndDate: string;
  hasActiveBacklog: boolean;
  totalHolidays: number;
  totalSelfLeaves: number;
  totalWorkingDays: number;
  totalStudyDays: number;
}

export function analyzePlanBacklog(plan: StrategyPlan): BacklogAnalysis {
  const today = getTodayIso();
  let backlogTasksCount = 0;
  let totalTasksCount = 0;
  let completedTasksCount = 0;

  let totalHolidays = 0;
  let totalSelfLeaves = 0;
  let totalWorkingDays = 0;

  // Track dates that have uncompleted tasks that were scheduled prior to today
  const overdueDates = new Set<string>();

  for (const day of plan.days) {
    if (day.dayType === "holiday") totalHolidays++;
    else if (day.dayType === "self_leave") totalSelfLeaves++;
    else totalWorkingDays++;

    for (const task of day.tasks) {
      totalTasksCount++;
      if (task.completed) {
        completedTasksCount++;
      } else if (day.date < today) {
        backlogTasksCount++;
        overdueDates.add(day.date);
      }
    }
  }

  // The user requirement: "shows end date if backlog 1 day increase 1 day"
  // Each distinct day with overdue unfinished tasks accounts for 1 backlog day delay
  const backlogDays = overdueDates.size > 0 ? overdueDates.size : (backlogTasksCount > 0 ? Math.ceil(backlogTasksCount / 2) : 0);

  const originalEndDate = plan.targetEndDate || (plan.days.length > 0 ? plan.days[plan.days.length - 1].date : today);
  const adjustedEndDate = addDaysToDate(originalEndDate, backlogDays);

  const completionRatePercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return {
    backlogTasksCount,
    backlogDays,
    totalTasksCount,
    completedTasksCount,
    completionRatePercent,
    originalEndDate,
    adjustedEndDate,
    hasActiveBacklog: backlogDays > 0,
    totalHolidays,
    totalSelfLeaves,
    totalWorkingDays,
    totalStudyDays: plan.days.length,
  };
}

// Calculate total days between two YYYY-MM-DD dates (inclusive)
export function calculateDaysBetween(startDate: string, endDate: string): number {
  try {
    const sParts = startDate.split("-").map(Number);
    const eParts = endDate.split("-").map(Number);
    const s = new Date(sParts[0], sParts[1] - 1, sParts[2]).getTime();
    const e = new Date(eParts[0], eParts[1] - 1, eParts[2]).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  } catch {
    return 60;
  }
}

// Generate an intelligent Default Plan for Class 12th Board Strategy
export function generateDefault12thPlan(options?: {
  startDate?: string;
  targetEndDate?: string;
  durationDays?: number;
  studentName?: string;
  subjectIds?: string[];
  makeBlank?: boolean;
}): StrategyPlan {
  const startDate = options?.startDate || getTodayIso();
  let duration = options?.durationDays || 60;
  if (options?.targetEndDate) {
    duration = calculateDaysBetween(startDate, options.targetEndDate);
  }
  const studentName = options?.studentName || "Vansh Kumar";
  const selectedSubjectIds = options?.subjectIds || ["physics", "chemistry", "mathematics", "cs", "english"];
  const makeBlank = Boolean(options?.makeBlank);

  // Collect all chapters for selected subjects
  const selectedSubjects = CBSE_12TH_SUBJECTS.filter((s) => selectedSubjectIds.includes(s.id));
  const allChapters: Array<{ subject: SubjectInfo; chapter: SubjectChapter }> = [];

  for (const sub of selectedSubjects) {
    for (const chap of sub.chapters) {
      allChapters.push({ subject: sub, chapter: chap });
    }
  }

  const days: PlanDay[] = [];
  let chapterIndex = 0;

  for (let i = 0; i < duration; i++) {
    const curDate = addDaysToDate(startDate, i);
    const dayOfWeek = getDayOfWeek(curDate);

    // Rule for Day Type:
    // Sunday (0) is automatically Holiday
    // Saturday (6) every alternate week is self-leave or holiday
    // Some periodic holidays / self leaves simulate realistic student life
    let dayType: DayType = "working";
    let targetHours = 5;
    let label = "";

    if (dayOfWeek === 0) {
      dayType = "holiday";
      targetHours = 10;
      label = "Sunday High-Output Day";
    } else if (i % 14 === 5) {
      dayType = "self_leave";
      targetHours = 8.5;
      label = "School Self-Study Leave (Bunk for Boards)";
    } else if (i % 21 === 10) {
      dayType = "holiday";
      targetHours = 10;
      label = "Gazetted Holiday / Break";
    } else {
      dayType = "working";
      targetHours = 5;
    }

    const tasks: PlanChapterTask[] = [];

    if (!makeBlank && allChapters.length > 0) {
      const taskCountForDay = dayType === "working" ? (i % 2 === 0 ? 1 : 2) : (dayType === "self_leave" ? 2 : 3);

      for (let t = 0; t < taskCountForDay; t++) {
        const item = allChapters[chapterIndex % allChapters.length];
        const taskTypeOptions: PlanChapterTask["taskType"][] = [
          "Theory",
          "NCERT Exercises",
          "PYQs",
          "Revision",
        ];
        const taskType = taskTypeOptions[(chapterIndex + t) % taskTypeOptions.length];

        tasks.push({
          id: `task_${curDate}_${t}_${Math.random().toString(36).substring(2, 7)}`,
          subjectId: item.subject.id,
          chapterId: item.chapter.id,
          chapterName: item.chapter.name,
          subjectName: item.subject.name,
          taskType,
          estHours: Math.max(2, Math.round(item.chapter.estHours / 2)),
          completed: i < 3,
          notes: `Focus on ${item.chapter.topics[0] || "core concepts"} & NCERT examples.`,
        });

        chapterIndex++;
      }
    }

    days.push({
      date: curDate,
      dayType,
      label,
      targetStudyHours: targetHours,
      tasks,
    });
  }

  const targetEndDate = options?.targetEndDate || addDaysToDate(startDate, duration - 1);

  return {
    id: `plan_cbse12_${Date.now()}`,
    title: "Mission 95%+ CBSE Class 12th Board Strategy",
    studentName,
    stream: "Science (PCM + CS)",
    startDate,
    targetEndDate,
    selectedSubjectIds,
    days,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Reset attendance so only Sunday is Holiday, rest are School Working days
export function resetAttendanceSundaysOnly(plan: StrategyPlan): StrategyPlan {
  const updatedDays = plan.days.map((d) => {
    const isSunday = getDayOfWeek(d.date) === 0;
    return {
      ...d,
      dayType: (isSunday ? "holiday" : "working") as DayType,
      targetStudyHours: isSunday ? 10 : 5,
      label: isSunday ? "Sunday Holiday" : "",
    };
  });

  return {
    ...plan,
    days: updatedDays,
    updatedAt: Date.now(),
  };
}

// Clear all tasks in strategy plan, making every date completely blank
export function clearAllPlanTasks(plan: StrategyPlan): StrategyPlan {
  const updatedDays = plan.days.map((d) => ({
    ...d,
    tasks: [],
  }));

  return {
    ...plan,
    days: updatedDays,
    updatedAt: Date.now(),
  };
}

// LocalStorage Persistence Keys
const STORAGE_KEY_PLAN = "vk_strategy_builder_plan_v1";
const STORAGE_KEY_SYLLABUS = "vk_strategy_syllabus_progress_v1";

export function loadSavedStrategyPlan(): StrategyPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading strategy plan from storage", e);
  }
  const defaultPlan = generateDefault12thPlan();
  saveStrategyPlan(defaultPlan);
  return defaultPlan;
}

export function saveStrategyPlan(plan: StrategyPlan): void {
  try {
    plan.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error("Error saving strategy plan", e);
  }
}

export function loadSyllabusProgress(): Record<string, SyllabusProgressItem> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYLLABUS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function saveSyllabusProgress(progress: Record<string, SyllabusProgressItem>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYLLABUS, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

// Shareable Compression URL Helper: Serializes plan to a safe base64 URL string
export function encodePlanToShareString(plan: StrategyPlan): string {
  try {
    const minimal = {
      t: plan.title,
      n: plan.studentName,
      s: plan.startDate,
      e: plan.targetEndDate,
      sub: plan.selectedSubjectIds,
      days: plan.days.map((d) => ({
        d: d.date,
        t: d.dayType === "working" ? 0 : d.dayType === "holiday" ? 1 : 2,
        l: d.label || "",
        h: d.targetStudyHours,
        k: d.tasks.map((tk) => ({
          s: tk.subjectId,
          c: tk.chapterId,
          n: tk.chapterName,
          p: tk.taskType,
          h: tk.estHours,
          m: tk.completed ? 1 : 0,
        })),
      })),
    };
    const json = JSON.stringify(minimal);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    console.error("Failed to encode plan", e);
    return "";
  }
}

export function decodePlanFromShareString(shareStr: string): StrategyPlan | null {
  try {
    const decodedJson = decodeURIComponent(escape(atob(shareStr)));
    const min = JSON.parse(decodedJson);
    if (!min || !min.days || !Array.isArray(min.days)) return null;

    const typeMap: DayType[] = ["working", "holiday", "self_leave"];

    const reconstructedDays: PlanDay[] = min.days.map((d: any) => ({
      date: d.d,
      dayType: typeMap[d.t] || "working",
      label: d.l || "",
      targetStudyHours: d.h || 5,
      tasks: (d.k || []).map((tk: any, idx: number) => {
        const sub = CBSE_12TH_SUBJECTS.find((s) => s.id === tk.s);
        return {
          id: `task_${d.d}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          subjectId: tk.s,
          chapterId: tk.c,
          chapterName: tk.n,
          subjectName: sub ? sub.name : tk.s,
          taskType: tk.p || "Theory",
          estHours: tk.h || 3,
          completed: tk.m === 1,
        };
      }),
    }));

    return {
      id: `plan_shared_${Date.now()}`,
      title: min.t || "Imported 12th Board Strategy",
      studentName: min.n || "Friend's Strategy",
      stream: "CBSE Class 12",
      startDate: min.s || getTodayIso(),
      targetEndDate: min.e || addDaysToDate(min.s || getTodayIso(), min.days.length),
      selectedSubjectIds: min.sub || ["physics", "chemistry", "mathematics", "cs", "english"],
      days: reconstructedDays,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (e) {
    console.error("Failed to decode plan", e);
    return null;
  }
}
