// lib/academicData.ts
// Central academic data: branches, semesters, and sample subjects
// Add new branches here at any time — they will automatically appear in the UI

export const BRANCHES = [
  'CSE',
  'CSE (AI & ML)',
  'CSE (Data Science)',
  'ECE',
  'ME',
  'CE',
  'IT',
] as const;

export type BranchName = typeof BRANCHES[number];

// Branch metadata (icon + color for the selection screen)
export const BRANCH_META: Record<string, { icon: string; color: string; shortName: string }> = {
  'CSE':               { icon: '💻', color: 'from-indigo-500 to-purple-600',  shortName: 'CSE'   },
  'CSE (AI & ML)':     { icon: '🤖', color: 'from-violet-500 to-purple-600', shortName: 'AI&ML' },
  'CSE (Data Science)':{ icon: '📊', color: 'from-blue-500 to-cyan-500',      shortName: 'DS'    },
  'ECE':               { icon: '📡', color: 'from-emerald-500 to-teal-500',   shortName: 'ECE'   },
  'ME':                { icon: '⚙️', color: 'from-orange-500 to-amber-500',   shortName: 'ME'    },
  'CE':                { icon: '🏗️', color: 'from-rose-500 to-red-500',       shortName: 'CE'    },
  'IT':                { icon: '🌐', color: 'from-sky-500 to-blue-600',       shortName: 'IT'    },
};

// Sample subjects per branch per semester
// Add as many subjects as you like; students can further add/edit/delete them
export const ACADEMIC_DATA: Record<string, Record<number, string[]>> = {
  'CSE': {
    1: ['Engineering Mathematics I', 'Engineering Physics', 'English Communication', 'Engineering Drawing', 'Programming in C'],
    2: ['Engineering Mathematics II', 'Data Structures', 'Digital Electronics', 'Object Oriented Programming', 'Environmental Science'],
    3: ['Algorithms', 'Database Management Systems', 'Operating Systems', 'Discrete Mathematics', 'Computer Organization'],
    4: ['Computer Networks', 'Theory of Computation', 'Software Engineering', 'Microprocessors', 'Design & Analysis of Algorithms'],
    5: ['Compiler Design', 'Artificial Intelligence', 'Web Technologies', 'Information Security', 'Elective I'],
    6: ['Cloud Computing', 'Machine Learning', 'Mobile Computing', 'Distributed Systems', 'Elective II'],
    7: ['Big Data Analytics', 'Internet of Things', 'Blockchain Technology', 'Project Work I', 'Elective III'],
    8: ['Project Work II', 'Seminar', 'Industrial Training', 'Elective IV'],
  },
  'CSE (AI & ML)': {
    1: ['Engineering Mathematics I', 'Engineering Physics', 'English Communication', 'Engineering Drawing', 'Introduction to AI'],
    2: ['Engineering Mathematics II', 'Python Programming', 'Digital Electronics', 'Statistics for AI', 'Environmental Science'],
    3: ['Data Structures', 'Probability & Statistics', 'Machine Learning Basics', 'Linear Algebra', 'Data Visualization'],
    4: ['Deep Learning', 'Natural Language Processing', 'Computer Vision', 'Neural Networks', 'AI Ethics'],
    5: ['Reinforcement Learning', 'Advanced ML', 'Big Data Analytics', 'AI for Healthcare', 'Elective I'],
    6: ['Generative AI', 'MLOps & Deployment', 'Time Series Analysis', 'Robotics & AI', 'Elective II'],
    7: ['Research Project I', 'Advanced NLP', 'AI Systems Design', 'Capstone Project', 'Elective III'],
    8: ['Research Project II', 'Seminar', 'Industrial Training', 'Elective IV'],
  },
  'CSE (Data Science)': {
    1: ['Engineering Mathematics I', 'Statistics Fundamentals', 'English Communication', 'Engineering Drawing', 'Python Programming'],
    2: ['Engineering Mathematics II', 'Data Structures', 'Database Systems', 'R Programming', 'Environmental Science'],
    3: ['Data Structures & Algorithms', 'Probability & Statistics', 'Data Wrangling', 'Exploratory Data Analysis', 'Business Intelligence'],
    4: ['Machine Learning', 'Data Mining', 'Data Warehousing', 'Advanced SQL', 'Statistical Modeling'],
    5: ['Deep Learning for Data Science', 'Big Data Technologies', 'Data Visualization', 'Cloud for Data Science', 'Elective I'],
    6: ['Time Series & Forecasting', 'NLP & Text Analytics', 'Advanced Analytics', 'Real-time Data Processing', 'Elective II'],
    7: ['Data Science Project I', 'Research Methods', 'AI Product Development', 'Capstone Project', 'Elective III'],
    8: ['Data Science Project II', 'Seminar', 'Industrial Training', 'Elective IV'],
  },
  'ECE': {
    1: ['Engineering Mathematics I', 'Engineering Physics', 'English Communication', 'Engineering Drawing', 'Basic Electronics'],
    2: ['Engineering Mathematics II', 'Network Analysis', 'Digital Electronics', 'Electronic Devices', 'Environmental Science'],
    3: ['Signals & Systems', 'Analog Circuits', 'Digital Communication', 'Electromagnetic Fields', 'Microcontrollers'],
    4: ['Digital Signal Processing', 'Microprocessors', 'Communication Systems', 'VLSI Design', 'Control Systems'],
    5: ['Embedded Systems', 'Advanced Communication', 'Optical Fiber Communication', 'RF Engineering', 'Elective I'],
    6: ['IoT & Wireless Communication', 'Antenna & Wave Propagation', 'Image Processing', 'PCB Design', 'Elective II'],
    7: ['Project Work I', 'Advanced VLSI', '5G & Beyond', 'Radar & Navigation', 'Elective III'],
    8: ['Project Work II', 'Seminar', 'Industrial Training', 'Elective IV'],
  },
  'ME': {
    1: ['Engineering Mathematics I', 'Engineering Physics', 'English Communication', 'Engineering Drawing', 'Workshop Practice'],
    2: ['Engineering Mathematics II', 'Thermodynamics', 'Engineering Mechanics', 'Material Science', 'Environmental Science'],
    3: ['Fluid Mechanics', 'Strength of Materials', 'Manufacturing Processes', 'Machine Drawing', 'Theory of Machines'],
    4: ['Heat Transfer', 'Dynamics of Machines', 'Industrial Engineering', 'Metrology & QC', 'Design of Machine Elements'],
    5: ['CAD/CAM', 'Automobile Engineering', 'Refrigeration & AC', 'Finite Element Analysis', 'Elective I'],
    6: ['Robotics & Automation', 'Power Plant Engineering', 'Advanced Manufacturing', 'Tribology', 'Elective II'],
    7: ['Project Work I', 'Industrial Management', 'Non-Destructive Testing', 'Mechatronics', 'Elective III'],
    8: ['Project Work II', 'Seminar', 'Industrial Training', 'Elective IV'],
  },
  'CE': {
    1: ['Engineering Mathematics I', 'Engineering Chemistry', 'English Communication', 'Engineering Drawing', 'Surveying I'],
    2: ['Engineering Mathematics II', 'Building Materials', 'Engineering Mechanics', 'Fluid Mechanics I', 'Environmental Science'],
    3: ['Strength of Materials', 'Fluid Mechanics II', 'Soil Mechanics', 'Structural Analysis I', 'Concrete Technology'],
    4: ['Structural Analysis II', 'Geotechnical Engineering', 'Hydraulics', 'Transportation Engineering', 'Design of Structures'],
    5: ['Foundation Engineering', 'Water Supply & Sanitation', 'Estimation & Costing', 'Construction Management', 'Elective I'],
    6: ['Advanced Structural Design', 'Environmental Engineering', 'Remote Sensing & GIS', 'Bridge Engineering', 'Elective II'],
    7: ['Project Work I', 'Earthquake Engineering', 'Smart Infrastructure', 'Urban Planning', 'Elective III'],
    8: ['Project Work II', 'Seminar', 'Industrial Training', 'Elective IV'],
  },
  'IT': {
    1: ['Engineering Mathematics I', 'Engineering Physics', 'English Communication', 'Engineering Drawing', 'Programming in C'],
    2: ['Engineering Mathematics II', 'Data Structures', 'Digital Electronics', 'Object Oriented Programming', 'Environmental Science'],
    3: ['Algorithms', 'Database Management Systems', 'Operating Systems', 'Web Development', 'Computer Networks I'],
    4: ['Computer Networks II', 'Software Engineering', 'Microprocessors', 'Java Programming', 'Human-Computer Interaction'],
    5: ['Cloud Computing', 'Information Security', 'Mobile App Development', 'DevOps', 'Elective I'],
    6: ['Big Data Technologies', 'Machine Learning', 'Blockchain', 'IT Project Management', 'Elective II'],
    7: ['Project Work I', 'Enterprise Systems', 'Digital Transformation', 'Research Methods', 'Elective III'],
    8: ['Project Work II', 'Seminar', 'Industrial Training', 'Elective IV'],
  },
};

// Colour pool for auto-assigning to subjects
export const SUBJECT_COLORS = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-sky-500 to-blue-500',
  'from-green-500 to-emerald-600',
];

// Icon pool for auto-assigning to subjects
export const SUBJECT_ICONS = ['📖', '🧮', '💡', '⚙️', '🌐', '🔬', '🏗️', '💻', '📊', '🎯', '🔧', '🌱', '🤖', '📡', '🧪'];

// Generate 6 default chapter names for any subject
export function generateDefaultChapters(subjectName: string) {
  return [
    { id: 1, title: 'Introduction & Basics',           completed: false },
    { id: 2, title: 'Core Concepts',                   completed: false },
    { id: 3, title: `${subjectName} Fundamentals`,     completed: false },
    { id: 4, title: 'Advanced Topics',                 completed: false },
    { id: 5, title: 'Practical Applications',          completed: false },
    { id: 6, title: 'Revision & Practice',             completed: false },
  ];
}
