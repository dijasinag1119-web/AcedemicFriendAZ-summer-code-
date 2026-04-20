// lib/seedData.ts — Default data injected on first login

import { toDateStr, fromDateStr } from './dateUtils';

// ── Quiz questions per subject (5 questions each, seed only first chapter's worth) ──

export const QUIZ_QUESTIONS: Record<string, { q: string; options: string[]; answer: number }[]> = {
  DSA: [
    { q: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], answer: 1 },
    { q: 'Which data structure uses LIFO order?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], answer: 1 },
    { q: 'What is the worst-case time complexity of QuickSort?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], answer: 2 },
    { q: 'Which traversal visits left, root, right?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], answer: 1 },
    { q: 'A heap is a complete binary tree satisfying what property?', options: ['BST property', 'Heap property', 'AVL property', 'Red-black property'], answer: 1 },
  ],
  DBMS: [
    { q: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Logic', 'Structured Queue Language', 'System Query Language'], answer: 0 },
    { q: 'Which normal form eliminates partial dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], answer: 1 },
    { q: 'What is a foreign key?', options: ['Primary key of same table', 'Key referencing another table\'s PK', 'Unique key', 'Composite key'], answer: 1 },
    { q: 'Which join returns all rows from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], answer: 3 },
    { q: 'ACID stands for?', options: ['Atomic, Consistent, Isolated, Durable', 'Accurate, Complete, Integrated, Distributed', 'Atomic, Complete, Indexed, Distributed', 'None of the above'], answer: 0 },
  ],
  OS: [
    { q: 'What is a deadlock?', options: ['System crash', 'Processes waiting for each other indefinitely', 'Memory overflow', 'CPU starvation'], answer: 1 },
    { q: 'What is the purpose of virtual memory?', options: ['Replace RAM', 'Extend usable memory using disk', 'Speed up CPU', 'Cache data'], answer: 1 },
    { q: 'Which scheduling algorithm minimizes average waiting time?', options: ['FCFS', 'SJF', 'Round Robin', 'Priority'], answer: 1 },
    { q: 'A semaphore is used for?', options: ['Memory allocation', 'Process synchronization', 'File management', 'CPU scheduling'], answer: 1 },
    { q: 'What does the OS kernel do?', options: ['Manages UI', 'Manages hardware resources', 'Compiles code', 'Renders graphics'], answer: 1 },
  ],
  CN: [
    { q: 'What does IP stand for?', options: ['Internet Protocol', 'Internal Packet', 'Interface Protocol', 'Internet Port'], answer: 0 },
    { q: 'Which layer handles routing?', options: ['Data Link', 'Network', 'Transport', 'Application'], answer: 1 },
    { q: 'TCP is different from UDP because?', options: ['TCP is faster', 'TCP is reliable, UDP is not', 'UDP is connection-oriented', 'Both are same'], answer: 1 },
    { q: 'What is the full form of DNS?', options: ['Domain Name System', 'Data Network Service', 'Dynamic Name Server', 'Distributed Network System'], answer: 0 },
    { q: 'HTTP default port number?', options: ['21', '22', '80', '443'], answer: 2 },
  ],
  SE: [
    { q: 'What is the Waterfall model?', options: ['Iterative model', 'Linear sequential model', 'Prototype model', 'Agile model'], answer: 1 },
    { q: 'What does UML stand for?', options: ['Unified Modeling Language', 'Universal Machine Language', 'Unified Machine Logic', 'Unique Model List'], answer: 0 },
    { q: 'Which SDLC phase identifies user requirements?', options: ['Design', 'Testing', 'Requirements Analysis', 'Maintenance'], answer: 2 },
    { q: 'Black box testing tests?', options: ['Internal code logic', 'External behavior/functionality', 'Database queries', 'Hardware'], answer: 1 },
    { q: 'Agile emphasizes?', options: ['Documentation over software', 'Working software and collaboration', 'Rigid processes', 'Following a strict plan'], answer: 1 },
  ],
  Maths: [
    { q: 'What is the derivative of sin(x)?', options: ['-cos(x)', 'cos(x)', 'tan(x)', '-sin(x)'], answer: 1 },
    { q: 'The rank of a matrix is?', options: ['Number of rows', 'Number of non-zero rows in row echelon form', 'Number of columns', 'Determinant value'], answer: 1 },
    { q: 'What is the period of cos(x)?', options: ['π', '2π', 'π/2', '4π'], answer: 1 },
    { q: 'The integral of 1/x is?', options: ['x', 'ln|x| + C', '1/x² + C', 'e^x + C'], answer: 1 },
    { q: 'Eigenvalues of diagonal matrix are?', options: ['All zeros', 'Diagonal elements themselves', 'Sum of diagonal', 'Product of diagonal'], answer: 1 },
  ],
};

// ── Flashcards per subject ──
export const FLASHCARDS: Record<string, { front: string; back: string }[]> = {
  DSA: [
    { front: 'What is Big O notation?', back: 'A mathematical notation describing the upper bound of algorithm complexity in the worst case.' },
    { front: 'What is a linked list?', back: 'A linear data structure where elements (nodes) are linked using pointers.' },
    { front: 'What is memoization?', back: 'An optimization technique that stores results of expensive function calls and returns cached results for same inputs.' },
    { front: 'Difference between BFS and DFS?', back: 'BFS explores level by level (uses Queue). DFS explores depth-first (uses Stack/Recursion).' },
    { front: 'What is dynamic programming?', back: 'Breaking a problem into overlapping subproblems and storing solutions to avoid recomputation.' },
  ],
  DBMS: [
    { front: 'What is normalization?', back: 'Process of organizing database to reduce redundancy and improve data integrity.' },
    { front: 'What is a transaction?', back: 'A unit of work that must be executed completely or not at all (ACID properties).' },
    { front: 'What is an ER diagram?', back: 'Entity-Relationship diagram showing entities, their attributes, and relationships between them.' },
    { front: 'What is indexing?', back: 'A data structure technique to quickly locate and access data in a database table.' },
    { front: 'What is a view in SQL?', back: 'A virtual table created by a query, showing selected data from one or more tables.' },
  ],
  OS: [
    { front: 'What is context switching?', back: 'Saving state of a process and loading state of another — allows multitasking.' },
    { front: 'What is thrashing?', back: 'Excessive paging activity where CPU spends more time swapping pages than executing processes.' },
    { front: 'What is a process vs thread?', back: 'Process: independent program with its own memory. Thread: lightweight unit within a process sharing memory.' },
    { front: 'What is paging?', back: 'Dividing memory into fixed-size pages (logical) mapped to physical frames, enabling non-contiguous allocation.' },
    { front: 'What is a mutex?', back: 'A mutual exclusion lock ensuring only one thread accesses a critical section at a time.' },
  ],
  CN: [
    { front: 'What is the OSI model?', back: '7-layer model: Physical, Data Link, Network, Transport, Session, Presentation, Application.' },
    { front: 'What is a subnet mask?', back: 'A 32-bit number that divides an IP address into network and host portions.' },
    { front: 'What is DHCP?', back: 'Dynamic Host Configuration Protocol — automatically assigns IP addresses to devices on a network.' },
    { front: 'What is ARP?', back: 'Address Resolution Protocol — maps IP addresses to MAC addresses on a local network.' },
    { front: 'What is a firewall?', back: 'A security system that monitors and controls network traffic based on predetermined rules.' },
  ],
  SE: [
    { front: 'What is coupling?', back: 'Degree of interdependence between software modules. Low coupling is preferred.' },
    { front: 'What is cohesion?', back: 'Degree to which elements of a module belong together. High cohesion is preferred.' },
    { front: 'What is a design pattern?', back: 'A reusable solution to a commonly occurring software design problem.' },
    { front: 'What is version control?', back: 'A system tracking changes to files over time, enabling collaboration and rollback (e.g., Git).' },
    { front: 'What is CI/CD?', back: 'Continuous Integration/Delivery — automating build, test, and deployment pipeline.' },
  ],
  Maths: [
    { front: 'What is a matrix eigenvalue?', back: 'Scalar λ such that Av = λv for a non-zero vector v. Found by solving det(A - λI) = 0.' },
    { front: 'What is the Laplace transform?', back: 'Converts time-domain functions to frequency domain: L{f(t)} = ∫₀^∞ e^(-st)f(t)dt.' },
    { front: 'What is a probability density function?', back: 'A function where area under the curve over an interval = probability of that outcome.' },
    { front: 'What is a group in abstract algebra?', back: 'A set with binary operation satisfying: closure, associativity, identity element, inverses.' },
    { front: 'What is the fundamental theorem of calculus?', back: 'Links differentiation and integration: d/dx[∫ₐˣ f(t)dt] = f(x).' },
  ],
};

// ── Subject definitions ──
export const SEED_SUBJECTS = [
  { id: 'dsa', name: 'DSA', icon: '🌳', color: '#6366f1', credits: 4,
    chapters: [
      'Introduction & Complexity', 'Arrays & Strings', 'Linked Lists',
      'Stacks & Queues', 'Trees & BST', 'Graphs & BFS/DFS', 'Dynamic Programming',
    ]
  },
  { id: 'dbms', name: 'DBMS', icon: '🗄️', color: '#8b5cf6', credits: 4,
    chapters: [
      'Introduction to DBMS', 'ER Modeling', 'Relational Algebra',
      'SQL Fundamentals', 'Normalization', 'Transactions & ACID', 'Query Optimization',
    ]
  },
  { id: 'os', name: 'OS', icon: '💻', color: '#06b6d4', credits: 4,
    chapters: [
      'Introduction to OS', 'Process Management', 'CPU Scheduling',
      'Memory Management', 'Virtual Memory', 'File Systems', 'Deadlocks',
    ]
  },
  { id: 'cn', name: 'CN', icon: '🌐', color: '#10b981', credits: 3,
    chapters: [
      'Network Fundamentals', 'OSI & TCP/IP Model', 'Data Link Layer',
      'Network Layer', 'Transport Layer', 'Application Layer', 'Network Security',
    ]
  },
  { id: 'se', name: 'SE', icon: '⚙️', color: '#f59e0b', credits: 3,
    chapters: [
      'Software Process Models', 'Requirements Engineering', 'System Design',
      'UML Diagrams', 'Software Testing', 'Project Management', 'Maintenance & Quality',
    ]
  },
  { id: 'maths', name: 'Maths', icon: '📐', color: '#f43f5e', credits: 4,
    chapters: [
      'Matrices & Linear Algebra', 'Differential Calculus', 'Integral Calculus',
      'Differential Equations', 'Probability & Statistics', 'Discrete Mathematics', 'Complex Numbers',
    ]
  },
];

// ── Timetable seed data ──
export const SEED_TIMETABLE = [
  { id: 'tt1', subjectId: 'dsa',   subjectName: 'DSA',   color: '#6366f1', teacher: 'Dr. Sharma',   room: 'A101', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
  { id: 'tt2', subjectId: 'dbms',  subjectName: 'DBMS',  color: '#8b5cf6', teacher: 'Prof. Gupta',   room: 'B203', dayOfWeek: 1, startTime: '11:00', endTime: '12:00' },
  { id: 'tt3', subjectId: 'os',    subjectName: 'OS',    color: '#06b6d4', teacher: 'Dr. Verma',     room: 'C301', dayOfWeek: 1, startTime: '14:00', endTime: '15:00' },
  { id: 'tt4', subjectId: 'cn',    subjectName: 'CN',    color: '#10b981', teacher: 'Prof. Singh',   room: 'A205', dayOfWeek: 2, startTime: '10:00', endTime: '11:00' },
  { id: 'tt5', subjectId: 'se',    subjectName: 'SE',    color: '#f59e0b', teacher: 'Dr. Mehta',     room: 'D102', dayOfWeek: 2, startTime: '12:00', endTime: '13:00' },
  { id: 'tt6', subjectId: 'maths', subjectName: 'Maths', color: '#f43f5e', teacher: 'Prof. Rao',     room: 'B101', dayOfWeek: 2, startTime: '15:00', endTime: '16:00' },
  { id: 'tt7', subjectId: 'dsa',   subjectName: 'DSA',   color: '#6366f1', teacher: 'Dr. Sharma',   room: 'A101', dayOfWeek: 3, startTime: '09:00', endTime: '10:00' },
  { id: 'tt8', subjectId: 'os',    subjectName: 'OS',    color: '#06b6d4', teacher: 'Dr. Verma',     room: 'C301', dayOfWeek: 3, startTime: '11:00', endTime: '12:00' },
  { id: 'tt9', subjectId: 'maths', subjectName: 'Maths', color: '#f43f5e', teacher: 'Prof. Rao',     room: 'B101', dayOfWeek: 3, startTime: '13:00', endTime: '14:00' },
  { id: 'tt10',subjectId: 'dbms',  subjectName: 'DBMS',  color: '#8b5cf6', teacher: 'Prof. Gupta',   room: 'B203', dayOfWeek: 4, startTime: '10:00', endTime: '11:00' },
  { id: 'tt11',subjectId: 'cn',    subjectName: 'CN',    color: '#10b981', teacher: 'Prof. Singh',   room: 'A205', dayOfWeek: 4, startTime: '14:00', endTime: '15:00' },
  { id: 'tt12',subjectId: 'se',    subjectName: 'SE',    color: '#f59e0b', teacher: 'Dr. Mehta',     room: 'D102', dayOfWeek: 4, startTime: '16:00', endTime: '17:00' },
  { id: 'tt13',subjectId: 'dsa',   subjectName: 'DSA',   color: '#6366f1', teacher: 'Dr. Sharma',   room: 'A101', dayOfWeek: 5, startTime: '09:00', endTime: '10:00' },
  { id: 'tt14',subjectId: 'maths', subjectName: 'Maths', color: '#f43f5e', teacher: 'Prof. Rao',     room: 'B101', dayOfWeek: 5, startTime: '11:00', endTime: '12:00' },
  { id: 'tt15',subjectId: 'dbms',  subjectName: 'DBMS',  color: '#8b5cf6', teacher: 'Prof. Gupta',   room: 'B203', dayOfWeek: 6, startTime: '10:00', endTime: '11:00' },
  { id: 'tt16',subjectId: 'os',    subjectName: 'OS',    color: '#06b6d4', teacher: 'Dr. Verma',     room: 'C301', dayOfWeek: 6, startTime: '12:00', endTime: '13:00' },
];

// ── Tasks seed ──
export function getSeedTasks() {
  const today = toDateStr();
  return [
    { id: 'task1', title: 'Complete DSA Assignment', desc: 'Solve linked list problems from chapter 3', priority: 'high', xpReward: 10, done: false, dueDate: today },
    { id: 'task2', title: 'Read DBMS Chapter 2', desc: 'Cover ER modeling and entity sets', priority: 'medium', xpReward: 10, done: false, dueDate: today },
    { id: 'task3', title: 'Practice OS Numericals', desc: 'CPU scheduling problems from previous exams', priority: 'high', xpReward: 10, done: false, dueDate: today },
    { id: 'task4', title: 'Revise CN Protocols', desc: 'Review OSI layers and their functions', priority: 'low', xpReward: 10, done: false, dueDate: today },
    { id: 'task5', title: 'Maths Problem Set 5', desc: 'Differential equations exercises 5.1 to 5.10', priority: 'medium', xpReward: 10, done: false, dueDate: today },
  ];
}

// ── Assignments seed ──
export function getSeedAssignments() {
  const d = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return toDateStr(date);
  };
  return [
    { id: 'asgn1', title: 'DSA Lab Report', subjectId: 'dsa', subjectName: 'DSA', dueDate: d(3), priority: 'high', status: 'pending', description: 'Write a lab report on sorting algorithm implementations with time complexity analysis.' },
    { id: 'asgn2', title: 'DBMS Mini Project', subjectId: 'dbms', subjectName: 'DBMS', dueDate: d(7), priority: 'medium', status: 'pending', description: 'Design and implement a library management system with full ER diagram and SQL queries.' },
    { id: 'asgn3', title: 'OS Assignment 3', subjectId: 'os', subjectName: 'OS', dueDate: d(12), priority: 'low', status: 'pending', description: 'Solve 5 CPU scheduling problems using FCFS, SJF, Round Robin and Priority algorithms.' },
  ];
}

// ── Exams seed ──
export function getSeedExams() {
  const d = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return toDateStr(date);
  };
  return [
    { id: 'exam1', subjectId: 'dsa', subjectName: 'DSA', examType: 'Mid', date: d(15), time: '10:00', venue: 'Hall A', syllabus: 'Arrays, Linked Lists, Trees, Graphs', topics: [
      { id: 'et1', title: 'Arrays & Strings', done: false },
      { id: 'et2', title: 'Linked Lists', done: false },
      { id: 'et3', title: 'Trees & BST', done: false },
      { id: 'et4', title: 'Graph Algorithms', done: false },
    ]},
    { id: 'exam2', subjectId: 'maths', subjectName: 'Maths', examType: 'Mid', date: d(18), time: '14:00', venue: 'Hall B', syllabus: 'Matrices, Calculus, Differential Equations', topics: [
      { id: 'et5', title: 'Matrices & Eigenvalues', done: false },
      { id: 'et6', title: 'Differential Calculus', done: false },
      { id: 'et7', title: 'Integral Calculus', done: false },
      { id: 'et8', title: 'Differential Equations', done: false },
    ]},
  ];
}

// ── Attendance seed (last 30 days realistic mock) ──
export function getSeedAttendance() {
  const records: Record<string, { totalClasses: number; presentCount: number; records: { date: string; status: string }[] }> = {};
  
  const subjects = ['dsa', 'dbms', 'os', 'cn', 'se', 'maths'];
  // Attendance percentages: realistic range per subject
  const subjectPresenceRate: Record<string, number> = {
    dsa: 0.88, dbms: 0.82, os: 0.75, cn: 0.91, se: 0.68, maths: 0.78
  };

  subjects.forEach(subId => {
    const subRecords: { date: string; status: string }[] = [];
    let present = 0;
    let total = 0;

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dow = d.getDay();
      if (dow === 0) continue; // skip Sundays
      
      const dateStr = toDateStr(d);
      const rate = subjectPresenceRate[subId];
      const rand = Math.random();
      
      if (rand < 0.05) {
        // Holiday
        subRecords.push({ date: dateStr, status: 'holiday' });
      } else {
        total++;
        if (Math.random() < rate) {
          present++;
          subRecords.push({ date: dateStr, status: 'present' });
        } else {
          subRecords.push({ date: dateStr, status: 'absent' });
        }
      }
    }

    records[subId] = { totalClasses: total, presentCount: present, records: subRecords };
  });

  return records;
}

// ── Notes seed ──
export function getSeedNotes() {
  return [
    {
      id: 'note1',
      title: 'DSA Key Concepts',
      subjectId: 'dsa',
      subjectName: 'DSA',
      content: `# DSA Key Concepts

## Time Complexity
- **O(1)**: Constant — array access
- **O(log n)**: Binary search, BST operations
- **O(n)**: Linear scan
- **O(n log n)**: Merge sort, Heap sort
- **O(n²)**: Bubble sort, Selection sort

## Important Algorithms
Q: What is the time complexity of BFS?
A: O(V + E) where V = vertices, E = edges

Q: When to use Dynamic Programming?
A: When problem has overlapping subproblems and optimal substructure

## Trees
- **BST**: Left < Root < Right
- **Balanced BST**: Height = O(log n)
- **Heap**: Complete binary tree with heap property`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note2',
      title: 'DBMS Quick Reference',
      subjectId: 'dbms',
      subjectName: 'DBMS',
      content: `# DBMS Quick Reference

## Normal Forms
- **1NF**: Atomic values, no repeating groups
- **2NF**: 1NF + no partial dependencies
- **3NF**: 2NF + no transitive dependencies
- **BCNF**: Every determinant is a candidate key

## SQL Joins
Q: What does INNER JOIN return?
A: Only matching rows from both tables

Q: Difference between WHERE and HAVING?
A: WHERE filters rows before grouping, HAVING filters after GROUP BY

## Transactions
- **Atomicity**: All or nothing
- **Consistency**: Valid state transitions
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed data persists`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// ── Activity seed (last 7 days) ──
export function getSeedActivity() {
  const activity: Record<string, { xpEarned: number; tasksCompleted: number; studyMinutes: number; attendanceMarked: boolean }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);
    activity[dateStr] = {
      xpEarned: Math.floor(Math.random() * 50) + 10,
      tasksCompleted: Math.floor(Math.random() * 4) + 1,
      studyMinutes: Math.floor(Math.random() * 120) + 30,
      attendanceMarked: Math.random() > 0.2,
    };
  }
  return activity;
}
