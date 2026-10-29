/**
 * Campus Helper — Core Data & LocalStorage Store
 * Pre-loaded with rich, realistic student life data.
 */

const STORAGE_KEYS = {
    PRIORITIES: 'campus_helper_priorities',
    SCHEDULE: 'campus_helper_schedule',
    FINANCE: 'campus_helper_finance',
    RESOURCES: 'campus_helper_resources',
    IDEAS: 'campus_helper_ideas',
    OPPORTUNITIES: 'campus_helper_opportunities',
    SCRATCHPAD: 'campus_helper_scratchpad',
    BOOKMARKS: 'campus_helper_bookmarks',
    SETTINGS: 'campus_helper_settings'
};

// Initial Seed Data
const DEFAULT_PRIORITIES = [
    {
        id: 'p1',
        title: 'Review Lecture 14: Dynamic Programming & Bellman-Ford',
        course: 'CS301 Algorithms',
        priority: 'high',
        dueDate: 'Today, 5:00 PM',
        completed: false,
        category: 'Study'
    },
    {
        id: 'p2',
        title: 'Submit Operating Systems Lab 4 (Process Synchronization)',
        course: 'OS204 Systems',
        priority: 'high',
        dueDate: 'Tonight, 11:59 PM',
        completed: false,
        category: 'Assignment'
    },
    {
        id: 'p3',
        title: 'Train ResNet-18 model on CIFAR-10 for AI project',
        course: 'AI402 Neural Nets',
        priority: 'medium',
        dueDate: 'Tomorrow, 2:00 PM',
        completed: false,
        category: 'Project'
    },
    {
        id: 'p4',
        title: 'Reserve Seminar Room B for Hackathon team brainstorm',
        course: 'Campus Life',
        priority: 'low',
        dueDate: 'Nov 1, 10:00 AM',
        completed: true,
        category: 'Personal'
    },
    {
        id: 'p5',
        title: 'Read Chapter 6 of Linear Algebra: Eigenvalues & PCA',
        course: 'MATH220 Lin Alg',
        priority: 'medium',
        dueDate: 'Nov 2, 4:00 PM',
        completed: true,
        category: 'Reading'
    }
];

const DEFAULT_SCHEDULE = {
    Monday: [
        { id: 'm1', name: 'Design & Analysis of Algorithms', code: 'CS301', room: 'Hall 302', prof: 'Dr. Aris Thorne', start: '09:00', end: '10:30', color: 'cyan', type: 'Lecture' },
        { id: 'm2', name: 'Deep Learning & Neural Architectures', code: 'AI402', room: 'Lab 4B', prof: 'Prof. Maya Lin', start: '11:45', end: '13:15', color: 'purple', type: 'Lab' },
        { id: 'm3', name: 'Operating Systems & Concurrency', code: 'OS204', room: 'Auditorium 1', prof: 'Dr. Keith Vance', start: '14:45', end: '16:15', color: 'emerald', type: 'Lecture' }
    ],
    Tuesday: [
        { id: 't1', name: 'Linear Algebra & High-Dim Spaces', code: 'MATH220', room: 'Room 205', prof: 'Dr. Elena Rostova', start: '08:45', end: '10:15', color: 'amber', type: 'Lecture' },
        { id: 't2', name: 'Computer Architecture & Assembly', code: 'EE210', room: 'Hall 108', prof: 'Prof. Samuel O\'Connor', start: '11:00', end: '12:30', color: 'rose', type: 'Lecture' },
        { id: 't3', name: 'Algorithms Tutorial & Problem Lab', code: 'CS301-T', room: 'Lab 2A', prof: 'TA Jason Miller', start: '14:00', end: '15:30', color: 'cyan', type: 'Tutorial' }
    ],
    Wednesday: [
        { id: 'w1', name: 'Design & Analysis of Algorithms', code: 'CS301', room: 'Hall 302', prof: 'Dr. Aris Thorne', start: '09:00', end: '10:30', color: 'cyan', type: 'Lecture' },
        { id: 'w2', name: 'Deep Learning & Neural Architectures', code: 'AI402', room: 'Lab 4B', prof: 'Prof. Maya Lin', start: '13:00', end: '14:30', color: 'purple', type: 'Lecture' },
        { id: 'w3', name: 'Systems Software Workshop', code: 'OS204-W', room: 'UNIX Lab', prof: 'Dr. Keith Vance', start: '15:30', end: '17:00', color: 'emerald', type: 'Workshop' }
    ],
    Thursday: [
        { id: 'th1', name: 'Linear Algebra & High-Dim Spaces', code: 'MATH220', room: 'Room 205', prof: 'Dr. Elena Rostova', start: '09:30', end: '11:00', color: 'amber', type: 'Lecture' },
        { id: 'th2', name: 'Autonomous Robotics Seminar', code: 'ROB490', room: 'Robotics Bay', prof: 'Prof. H. Tanaka', start: '13:30', end: '15:00', color: 'purple', type: 'Seminar' }
    ],
    Friday: [
        { id: 'f1', name: 'Computer Networks & Security', code: 'CS320', room: 'Hall 201', prof: 'Dr. Sarah Connor', start: '10:00', end: '11:30', color: 'cyan', type: 'Lecture' },
        { id: 'f2', name: 'AI Capstone Project Mentoring', code: 'AI499', room: 'Innovation Lounge', prof: 'Prof. Maya Lin', start: '14:00', end: '16:00', color: 'rose', type: 'Mentorship' }
    ]
};

const DEFAULT_FINANCE = {
    budget: 800.00,
    categories: {
        food: { name: 'Cafeteria & Dining', budget: 250.00, spent: 184.50, color: 'coral' },
        tech: { name: 'Tech & Subscriptions', budget: 120.00, spent: 85.00, color: 'cyan' },
        books: { name: 'Books & Course Supplies', budget: 150.00, spent: 65.00, color: 'emerald' },
        transit: { name: 'Transit & Commuting', budget: 80.00, spent: 41.00, color: 'amber' },
        personal: { name: 'Social & Campus Life', budget: 200.00, spent: 50.00, color: 'purple' }
    },
    transactions: [
        { id: 'tx1', desc: 'Campus Central Café - Cold Brew & Bagel', amount: 8.50, category: 'food', date: 'Today, 10:15 AM' },
        { id: 'tx2', desc: 'GitHub Copilot Student Renewal', amount: 0.00, category: 'tech', date: 'Yesterday' },
        { id: 'tx3', desc: 'AWS Student Cloud Credits (GPU Server)', amount: 24.50, category: 'tech', date: 'Oct 27' },
        { id: 'tx4', desc: 'Algorithm Design Manual (Rental)', amount: 42.00, category: 'books', date: 'Oct 25' },
        { id: 'tx5', desc: 'Metro Monthly Student Pass', amount: 35.00, category: 'transit', date: 'Oct 24' },
        { id: 'tx6', desc: 'Campus Pizzeria (Study Group Dinner)', amount: 28.00, category: 'food', date: 'Oct 22' },
        { id: 'tx7', desc: 'Mechanical Keyboard Switch Lube Kit', amount: 14.50, category: 'personal', date: 'Oct 20' }
    ]
};

const DEFAULT_RESOURCES = [
    {
        id: 'r1',
        title: 'MIT 6.006: Introduction to Algorithms Notes & Cheatsheets',
        course: 'CS301',
        category: 'Lecture Notes',
        type: 'PDF',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        tags: ['Dynamic Programming', 'Graph Theory', 'Sorting'],
        description: 'Comprehensive, battle-tested lecture notes covering asymptotics, trees, Bellman-Ford, and dynamic programming with full proofs.'
    },
    {
        id: 'r2',
        title: 'Stanford CS229: Machine Learning Super Cheatsheet',
        course: 'AI402',
        category: 'Cheatsheet',
        type: 'Guide',
        url: 'https://stanford.edu/~shervine/teaching/cs-229/',
        tags: ['Neural Nets', 'Loss Functions', 'Backprop'],
        description: 'Famous concise 2-page cheatsheets by Afshine & Shervine Amidi summarizing architectures, gradients, and regularization.'
    },
    {
        id: 'r3',
        title: 'Operating Systems: Three Easy Pieces (OSTEP Free Online)',
        course: 'OS204',
        category: 'Textbook',
        type: 'Free Book',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
        tags: ['Virtualization', 'Concurrency', 'Persistence'],
        description: 'The golden standard open textbook for OS fundamentals with practical C code examples and concurrency exercises.'
    },
    {
        id: 'r4',
        title: 'The Matrix Calculus You Need For Deep Learning (Explained)',
        course: 'MATH220',
        category: 'Tutorial',
        type: 'Web Guide',
        url: 'https://explained.ai/matrix-calculus/',
        tags: ['Jacobians', 'Gradients', 'Tensors'],
        description: 'Intuitive visual guide for matrix derivatives and tensor chain rule needed for gradient descent.'
    },
    {
        id: 'r5',
        title: 'GitHub Student Developer Pack Perks Directory',
        course: 'General',
        category: 'Free Materials',
        type: 'Tooling',
        url: 'https://education.github.com/pack',
        tags: ['Free Domain', 'Cloud Credits', 'JetBrains'],
        description: 'Complete breakdown of $10,000+ free student benefits including DigitalOcean credits, JetBrains IDEs, and Figma Pro.'
    },
    {
        id: 'r6',
        title: 'Interactive 3D Linear Algebra Visualizer (Gilbert Strang)',
        course: 'MATH220',
        category: 'Interactive',
        type: 'Applet',
        url: 'https://immersivemath.com/ila/index.html',
        tags: ['Eigenvectors', 'Determinants', 'Null Space'],
        description: 'Fully interactive WebGL linear algebra book where you can rotate vectors, hyperplanes, and transformations in real time.'
    }
];

const DEFAULT_IDEAS = [
    {
        id: 'idea1',
        title: 'Smart Campus Food Waste Rescuer',
        description: 'Real-time notifications connecting student clubs with excess catered food from campus events to hungry dorm residents before it spoils.',
        column: 'ideation',
        tags: ['Mobile App', 'Sustainability', 'Social Impact'],
        priority: 'high',
        date: 'Oct 26',
        upvotes: 14
    },
    {
        id: 'idea2',
        title: 'BLE Mesh Indoor Campus Navigator',
        description: 'Micro-location indoor navigation for complex university buildings using Bluetooth Low Energy beacons, tailored for visually impaired students.',
        column: 'ideation',
        tags: ['IoT', 'Accessibility', 'Hardware'],
        priority: 'medium',
        date: 'Oct 24',
        upvotes: 9
    },
    {
        id: 'idea3',
        title: 'AI Audio Lecture Synthesizer & Mind-Mapper',
        description: 'Pulls recorded audio from lectures, creates speaker-diarized transcripts, and outputs interactive SVG conceptual mind maps.',
        column: 'progress',
        tags: ['AI/ML', 'Whisper API', 'Graph UI'],
        priority: 'high',
        date: 'Oct 21',
        upvotes: 27
    },
    {
        id: 'idea4',
        title: 'Peer-to-Peer Lab Equipment Swapper',
        description: 'Automated campus reservation and escrow system for oscilloscopes, solder stations, and 3D printer time slots.',
        column: 'progress',
        tags: ['Web Platform', 'Hardware', 'Automation'],
        priority: 'medium',
        date: 'Oct 18',
        upvotes: 18
    },
    {
        id: 'idea5',
        title: 'Smart Solar-Powered Bicycle Anti-Theft Lock',
        description: 'GPS-embedded bike lock with vibration sensors, solar trickle charging, and instant campus security webhook alerts on tampering.',
        column: 'ready',
        tags: ['Hardware', 'IoT', 'Embedded C++'],
        priority: 'high',
        date: 'Oct 12',
        upvotes: 42
    },
    {
        id: 'idea6',
        title: 'Open Syllabus Index for Computer Science',
        description: 'Aggregator scraping and visualizing curriculum dependencies, required textbooks, and past project rubrics across 50 top universities.',
        column: 'ready',
        tags: ['Open Source', 'Data Scraping', 'Vue/Vanilla'],
        priority: 'medium',
        date: 'Oct 08',
        upvotes: 31
    }
];

const DEFAULT_OPPORTUNITIES = [
    {
        id: 'opp1',
        title: 'Google Summer of Code 2027 Student Contributor',
        org: 'Google Open Source',
        category: 'internship',
        type: 'Remote Global Fellowship',
        stipend: '$3,000 - $6,000 Stipend',
        deadline: 'In 18 Days (Nov 16)',
        urgency: 'high',
        tags: ['Open Source', 'Mentorship', 'Remote'],
        description: 'Work with world-class open-source organizations on real production code under the guidance of industry engineers.',
        link: 'https://summerofcode.withgoogle.com',
        bookmarked: true
    },
    {
        id: 'opp2',
        title: 'HackMIT 2026: Global Collegiate Hackathon',
        org: 'Massachusetts Institute of Technology',
        category: 'hackathon',
        type: 'Hackathon & Showcase',
        stipend: '$50,000 in Prizes + Travel Grants',
        deadline: 'In 6 Days (Nov 4)',
        urgency: 'critical',
        tags: ['AI Hardware', 'Web3', 'Travel Reimbursed'],
        description: '1,000+ collegiate hackers converge to build radical hardware and software projects over a high-energy 36-hour weekend.',
        link: 'https://hackmit.org',
        bookmarked: false
    },
    {
        id: 'opp3',
        title: 'OpenAI Undergraduate Student Research Residency',
        org: 'OpenAI Labs',
        category: 'research',
        type: 'Full-Time Summer Residency',
        stipend: '$9,800/Month + Housing',
        deadline: 'In 24 Days (Nov 22)',
        urgency: 'medium',
        tags: ['LLMs', 'RLHF', 'PyTorch', 'San Francisco'],
        description: 'Direct collaboration with research scientists pushing frontier AI alignment, reasoning capabilities, and scalable supervision.',
        link: 'https://openai.com/careers',
        bookmarked: false
    },
    {
        id: 'opp4',
        title: 'Campus AI & Robotics Demo Day 2026',
        org: 'University Innovation Hub',
        category: 'event',
        type: 'On-Campus Exhibition & Pitch',
        stipend: '$10,000 Seed Grant',
        deadline: 'In 11 Days (Nov 9)',
        urgency: 'medium',
        tags: ['Angel Pitch', 'Networking', 'Free Food'],
        description: 'Pitch your student prototype or research poster directly to 20+ visiting venture capitalists and angel alumni.',
        link: 'https://innovation.campus.edu',
        bookmarked: true
    },
    {
        id: 'opp5',
        title: 'Microsoft Explore Undergraduate Internship Program',
        org: 'Microsoft Corporation',
        category: 'internship',
        type: 'Summer SWE + PM Rotational',
        stipend: '$48/Hour + Relocation',
        deadline: 'In 14 Days (Nov 12)',
        urgency: 'high',
        tags: ['Cloud', 'Freshman/Sophomore/Junior', 'Redmond WA'],
        description: 'Designed specifically for early collegiate students to explore both Software Engineering and Product Management roles.',
        link: 'https://careers.microsoft.com',
        bookmarked: false
    },
    {
        id: 'opp6',
        title: 'NeurIPS Student Workshop & Travel Scholarship',
        org: 'Neural Information Processing Systems',
        category: 'research',
        type: 'Conference Grant',
        stipend: 'Full Flight + Hotel + Registration',
        deadline: 'In 30 Days (Nov 28)',
        urgency: 'low',
        tags: ['Deep Learning', 'Academic Paper', 'Vancouver'],
        description: 'Travel scholarship covering all expenses to present peer-reviewed undergraduate posters at the world\'s premiere AI venue.',
        link: 'https://neurips.cc',
        bookmarked: false
    }
];

// Interactive Quiz Questions for Study Hub Test Center
const QUIZ_QUESTIONS = [
    {
        id: 1,
        course: 'Algorithms',
        question: 'What is the tight worst-case time complexity of finding the shortest path in a weighted directed graph with negative edge weights using the Bellman-Ford algorithm?',
        options: [
            { id: 'A', text: 'O(V + E)' },
            { id: 'B', text: 'O(V · E)', correct: true },
            { id: 'C', text: 'O(E log V)' },
            { id: 'D', text: 'O(V² log V)' }
        ],
        explanation: 'Bellman-Ford relaxes all |E| edges |V| - 1 times, yielding a worst-case time complexity of O(V · E).'
    },
    {
        id: 2,
        course: 'Deep Learning',
        question: 'Which vanishing gradient mitigation technique replaces the traditional Sigmoid activation function in hidden layers of deep neural networks?',
        options: [
            { id: 'A', text: 'Softmax' },
            { id: 'B', text: 'ReLU (Rectified Linear Unit)', correct: true },
            { id: 'C', text: 'Hyperbolic Tangent (Tanh)' },
            { id: 'D', text: 'Binary Step' }
        ],
        explanation: 'ReLU has a constant gradient of 1 for positive inputs, which prevents the gradient from exponentially shrinking through deep layers.'
    },
    {
        id: 3,
        course: 'Operating Systems',
        question: 'Which of the following conditions is NOT one of the four Coffman conditions necessary for a deadlock to occur?',
        options: [
            { id: 'A', text: 'Mutual Exclusion' },
            { id: 'B', text: 'Hold and Wait' },
            { id: 'C', text: 'Preemption of resources', correct: true },
            { id: 'D', text: 'Circular Wait' }
        ],
        explanation: 'NO preemption is required for deadlock; if resources CAN be preempted, deadlock cannot occur.'
    },
    {
        id: 4,
        course: 'Linear Algebra',
        question: 'If a square matrix A has an eigenvalue λ = 0, what does this guarantee about the matrix?',
        options: [
            { id: 'A', text: 'The matrix A is invertible' },
            { id: 'B', text: 'The determinant of A is 0 (A is singular)', correct: true },
            { id: 'C', text: 'The trace of A must be 0' },
            { id: 'D', text: 'A is an identity matrix' }
        ],
        explanation: 'The determinant of a matrix equals the product of its eigenvalues. If any eigenvalue is 0, det(A) = 0 and A is non-invertible.'
    },
    {
        id: 5,
        course: 'System Architecture',
        question: 'In cache memory design, what is the primary benefit of a Direct-Mapped Cache compared to a Fully Associative Cache?',
        options: [
            { id: 'A', text: 'Lowest conflict misses' },
            { id: 'B', text: 'Simpler hardware logic and faster hit latency', correct: true },
            { id: 'C', text: 'Elimination of all capacity misses' },
            { id: 'D', text: 'Higher hit rate on random memory accesses' }
        ],
        explanation: 'Direct-mapped cache has only one candidate slot per block, requiring only a single tag comparator, which makes it fast and power-efficient.'
    }
];

// Data Store Helper with LocalStorage Persistence
const Store = {
    get(key, defaultValue) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultValue;
        } catch (e) {
            console.warn(`Error reading from localStorage [${key}]:`, e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving to localStorage [${key}]:`, e);
        }
    },
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.PRIORITIES)) {
            this.set(STORAGE_KEYS.PRIORITIES, DEFAULT_PRIORITIES);
        }
        if (!localStorage.getItem(STORAGE_KEYS.SCHEDULE)) {
            this.set(STORAGE_KEYS.SCHEDULE, DEFAULT_SCHEDULE);
        }
        if (!localStorage.getItem(STORAGE_KEYS.FINANCE)) {
            this.set(STORAGE_KEYS.FINANCE, DEFAULT_FINANCE);
        }
        if (!localStorage.getItem(STORAGE_KEYS.RESOURCES)) {
            this.set(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);
        }
        if (!localStorage.getItem(STORAGE_KEYS.IDEAS)) {
            this.set(STORAGE_KEYS.IDEAS, DEFAULT_IDEAS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES)) {
            this.set(STORAGE_KEYS.OPPORTUNITIES, DEFAULT_OPPORTUNITIES);
        }
        if (!localStorage.getItem(STORAGE_KEYS.SCRATCHPAD)) {
            const initialScratch = `# Quick Scratchpad 📝\n- [ ] Prep questions for Dr. Thorne's office hours\n- [ ] Check if GPU cluster reservation confirmed\n- [x] Download OSTEP Chapter 7\n\n*Idea spark:* Combine Web Audio + Speech Recognition for instant lecture summarization.`;
            this.set(STORAGE_KEYS.SCRATCHPAD, initialScratch);
        }
    },
    resetAll() {
        localStorage.clear();
        this.init();
    }
};

// Auto initialize on script load
Store.init();

// Export to window for global inline accessibility
if (typeof window !== 'undefined') {
    window.STORAGE_KEYS = STORAGE_KEYS;
    window.DEFAULT_PRIORITIES = DEFAULT_PRIORITIES;
    window.DEFAULT_SCHEDULE = DEFAULT_SCHEDULE;
    window.DEFAULT_FINANCE = DEFAULT_FINANCE;
    window.DEFAULT_RESOURCES = DEFAULT_RESOURCES;
    window.DEFAULT_IDEAS = DEFAULT_IDEAS;
    window.DEFAULT_OPPORTUNITIES = DEFAULT_OPPORTUNITIES;
    window.QUIZ_QUESTIONS = QUIZ_QUESTIONS;
    window.Store = Store;
}
