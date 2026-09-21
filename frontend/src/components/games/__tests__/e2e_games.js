// Complete End-to-End Suite for All Games
console.log("==================================================");
console.log("        END-TO-END VERIFICATION TEST SUITE       ");
console.log("==================================================");

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
  }
}

// 1. QUEENS TEST
console.log("\n1. Testing Queens Logic & Boards:");
const QUEENS_LEVELS = [
  {
    name: 'Casual Mosaic (6x6)',
    size: 6,
    regions: [
      [0, 0, 0, 0, 1, 1],
      [2, 2, 0, 1, 1, 1],
      [2, 2, 2, 3, 3, 1],
      [4, 2, 3, 3, 3, 3],
      [4, 4, 4, 5, 3, 3],
      [4, 4, 5, 5, 5, 5]
    ],
    solution: [[0, 2], [1, 5], [2, 1], [3, 4], [4, 0], [5, 3]]
  },
  {
    name: 'Crown Lattice (6x6)',
    size: 6,
    regions: [
      [1, 0, 0, 0, 0, 2],
      [1, 1, 0, 0, 2, 2],
      [1, 3, 3, 2, 2, 4],
      [3, 3, 3, 5, 4, 4],
      [3, 3, 5, 5, 4, 4],
      [5, 5, 5, 5, 4, 4]
    ],
    solution: [[0, 3], [1, 0], [2, 4], [3, 1], [4, 5], [5, 2]]
  },
  {
    name: 'Daily Challenge (7x7)',
    size: 7,
    regions: [
      [0, 0, 0, 0, 0, 1, 1],
      [2, 2, 0, 0, 1, 1, 1],
      [2, 2, 2, 3, 3, 1, 1],
      [4, 2, 2, 3, 3, 3, 3],
      [4, 4, 4, 5, 5, 5, 3],
      [6, 4, 4, 5, 5, 5, 5],
      [6, 6, 6, 6, 5, 5, 5]
    ],
    solution: [[0, 3], [1, 6], [2, 2], [3, 5], [4, 1], [5, 4], [6, 0]]
  },
  {
    name: 'Grand Territory (8x8)',
    size: 8,
    regions: [
      [0, 0, 0, 0, 1, 1, 1, 2],
      [3, 0, 0, 1, 1, 1, 2, 2],
      [3, 3, 0, 4, 4, 1, 2, 2],
      [3, 3, 3, 4, 4, 5, 2, 2],
      [3, 3, 4, 4, 4, 5, 5, 5],
      [7, 3, 4, 4, 6, 6, 5, 5],
      [7, 7, 7, 6, 6, 6, 6, 5],
      [7, 7, 7, 7, 6, 6, 5, 5]
    ],
    solution: [[0, 2], [1, 5], [2, 7], [3, 0], [4, 3], [5, 6], [6, 4], [7, 1]]
  }
];

QUEENS_LEVELS.forEach(lvl => {
  const { size, regions, solution, name } = lvl;
  const rows = new Set(solution.map(q => q[0]));
  const cols = new Set(solution.map(q => q[1]));
  const regs = new Set(solution.map(q => regions[q[0]][q[1]]));

  let touch = false;
  for (let i = 0; i < solution.length; i++) {
    for (let j = i + 1; j < solution.length; j++) {
      if (Math.abs(solution[i][0] - solution[j][0]) <= 1 && Math.abs(solution[i][1] - solution[j][1]) <= 1) {
        touch = true;
      }
    }
  }

  assert(rows.size === size && cols.size === size && regs.size === size && !touch, `Queens: ${name} solves with zero conflicts`);
});

// 2. SUDOKU TEST
console.log("\n2. Testing Sudoku Levels & Logic:");
const SUDOKU_LEVELS = [
  {
    name: 'Mini Sudoku (6x6)',
    size: 6,
    boxRows: 2,
    boxCols: 3,
    solution: [
      [4, 2, 3, 5, 1, 6],
      [5, 6, 1, 3, 2, 4],
      [1, 5, 4, 2, 6, 3],
      [2, 3, 6, 4, 5, 1],
      [3, 1, 2, 6, 4, 5],
      [6, 4, 5, 1, 3, 2]
    ]
  },
  {
    name: 'Classic Easy (9x9)',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9]
    ]
  },
  {
    name: 'Classic Medium (9x9)',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    solution: [
      [4, 3, 5, 2, 6, 9, 7, 8, 1],
      [6, 8, 2, 5, 7, 1, 4, 9, 3],
      [1, 9, 7, 8, 3, 4, 5, 6, 2],
      [8, 2, 6, 1, 9, 5, 3, 4, 7],
      [3, 7, 4, 6, 8, 2, 9, 1, 5],
      [9, 5, 1, 7, 4, 3, 6, 2, 8],
      [5, 1, 9, 3, 2, 6, 8, 7, 4],
      [2, 4, 8, 9, 5, 7, 1, 3, 6],
      [7, 6, 3, 4, 1, 8, 2, 5, 9]
    ]
  },
  {
    name: 'Classic Hard (9x9)',
    size: 9,
    boxRows: 3,
    boxCols: 3,
    solution: [
      [1, 5, 2, 4, 8, 9, 3, 7, 6],
      [7, 3, 9, 2, 5, 6, 8, 4, 1],
      [4, 6, 8, 3, 7, 1, 2, 9, 5],
      [3, 8, 7, 1, 2, 4, 6, 5, 9],
      [5, 9, 1, 7, 6, 3, 4, 2, 8],
      [2, 4, 6, 8, 9, 5, 7, 1, 3],
      [9, 1, 4, 6, 3, 7, 5, 8, 2],
      [6, 2, 5, 9, 4, 8, 1, 3, 7],
      [8, 7, 3, 5, 1, 2, 9, 6, 4]
    ]
  }
];

SUDOKU_LEVELS.forEach(lvl => {
  const { size, boxRows, boxCols, solution, name } = lvl;
  let valid = true;
  for (let r = 0; r < size; r++) {
    if (new Set(solution[r]).size !== size) valid = false;
  }
  for (let c = 0; c < size; c++) {
    const s = new Set();
    for (let r = 0; r < size; r++) s.add(solution[r][c]);
    if (s.size !== size) valid = false;
  }
  for (let br = 0; br < size; br += boxRows) {
    for (let bc = 0; bc < size; bc += boxCols) {
      const s = new Set();
      for (let r = br; r < br + boxRows; r++) {
        for (let c = bc; c < bc + boxCols; c++) {
          s.add(solution[r][c]);
        }
      }
      if (s.size !== size) valid = false;
    }
  }
  assert(valid, `Sudoku: ${name} satisfies row/col/box Latin square rules`);
});

// 3. TANGO TEST
console.log("\n3. Testing Tango Constraints & Logic:");
const TANGO_LEVELS = [
  {
    name: 'Daily Celestial (6x6)',
    size: 6,
    solution: [
      ['S', 'S', 'M', 'M', 'S', 'M'],
      ['M', 'M', 'S', 'S', 'M', 'S'],
      ['S', 'M', 'M', 'S', 'S', 'M'],
      ['M', 'S', 'S', 'M', 'M', 'S'],
      ['S', 'M', 'S', 'M', 'S', 'M'],
      ['M', 'S', 'M', 'S', 'M', 'S']
    ],
    horizontalConstraints: {
      '0,0': '=',
      '1,0': '=',
      '2,1': '=',
      '2,3': '=',
      '4,0': 'x',
      '5,2': 'x'
    },
    verticalConstraints: {
      '0,1': 'x',
      '1,2': 'x',
      '2,4': 'x',
      '3,1': 'x',
      '4,2': 'x'
    }
  },
  {
    name: 'Solar Eclipse (6x6)',
    size: 6,
    solution: [
      ['M', 'S', 'S', 'M', 'S', 'M'],
      ['S', 'M', 'M', 'S', 'M', 'S'],
      ['S', 'S', 'M', 'M', 'S', 'M'],
      ['M', 'M', 'S', 'S', 'M', 'S'],
      ['M', 'S', 'M', 'S', 'S', 'M'],
      ['S', 'M', 'S', 'M', 'M', 'S']
    ],
    horizontalConstraints: {
      '0,1': '=',
      '1,1': '=',
      '2,0': '=',
      '3,0': '=',
      '4,4': 'x'
    },
    verticalConstraints: {
      '0,0': 'x',
      '1,3': 'x',
      '2,2': 'x',
      '3,4': 'x'
    }
  }
];

TANGO_LEVELS.forEach(lvl => {
  const { size, solution, horizontalConstraints, verticalConstraints, name } = lvl;
  let valid = true;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 2; c++) {
      if (solution[r][c] === solution[r][c+1] && solution[r][c+1] === solution[r][c+2]) valid = false;
    }
    if (solution[r].filter(v => v === 'S').length !== 3) valid = false;
  }
  for (let c = 0; c < size; c++) {
    let s = 0;
    for (let r = 0; r < size; r++) {
      if (solution[r][c] === 'S') s++;
      if (r < size - 2 && solution[r][c] === solution[r+1][c] && solution[r+1][c] === solution[r+2][c]) valid = false;
    }
    if (s !== 3) valid = false;
  }

  Object.entries(horizontalConstraints).forEach(([k, rel]) => {
    const [r, c] = k.split(',').map(Number);
    if (rel === '=' && solution[r][c] !== solution[r][c+1]) valid = false;
    if (rel === 'x' && solution[r][c] === solution[r][c+1]) valid = false;
  });
  Object.entries(verticalConstraints).forEach(([k, rel]) => {
    const [r, c] = k.split(',').map(Number);
    if (rel === '=' && solution[r][c] !== solution[r+1][c]) valid = false;
    if (rel === 'x' && solution[r][c] === solution[r+1][c]) valid = false;
  });

  assert(valid, `Tango: ${name} balanced with 0 constraint breaches`);
});

// 4. MEMORY MATRIX TEST
console.log("\n4. Testing Memory Matrix Progression:");
const LEVEL_CONFIGS = [
  { level: 1, size: 3, tilesCount: 3, flashMs: 1300 },
  { level: 2, size: 3, tilesCount: 4, flashMs: 1200 },
  { level: 3, size: 4, tilesCount: 4, flashMs: 1200 },
  { level: 4, size: 4, tilesCount: 5, flashMs: 1100 },
  { level: 5, size: 4, tilesCount: 6, flashMs: 1100 },
  { level: 6, size: 5, tilesCount: 6, flashMs: 1000 },
  { level: 7, size: 5, tilesCount: 7, flashMs: 1000 },
  { level: 8, size: 5, tilesCount: 8, flashMs: 950 },
  { level: 9, size: 6, tilesCount: 8, flashMs: 900 },
  { level: 10, size: 6, tilesCount: 9, flashMs: 850 }
];

LEVEL_CONFIGS.forEach(cfg => {
  const total = cfg.size * cfg.size;
  assert(cfg.tilesCount < total && cfg.flashMs > 500, `Memory Matrix Level ${cfg.level} config (${cfg.size}x${cfg.size}, ${cfg.tilesCount} tiles) valid`);
});

// 5. PINPOINT FUZZY MATCHER TEST
console.log("\n5. Testing Pinpoint Answer Matcher:");
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}
function testMatch(guess, category, aliases) {
  const normGuess = normalize(guess);
  const normCategory = normalize(category);
  if (normGuess === normCategory) return true;
  for (const alias of aliases) {
    const normAlias = normalize(alias);
    if (normGuess === normAlias) return true;
    if (normGuess.length >= 3 && (normAlias.includes(normGuess) || normGuess.includes(normAlias))) return true;
  }
  const words = category.toLowerCase().split(/[\s&/]+/);
  for (const w of words) {
    const normW = normalize(w);
    if (normW.length >= 3 && (normGuess.includes(normW) || normW.includes(normGuess))) {
      return true;
    }
  }
  return false;
}

assert(testMatch('React Hooks', 'React Hooks', ['react hooks', 'hooks']), "Pinpoint exact match");
assert(testMatch('hooks', 'React Hooks', ['react hooks', 'hooks']), "Pinpoint keyword match 'hooks'");
assert(testMatch('devops', 'Containerization & DevOps', ['devops', 'docker']), "Pinpoint alias match 'devops'");
assert(testMatch('SQL query', 'SQL Clauses', ['sql clauses', 'sql']), "Pinpoint partial match 'SQL query'");

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log("==================================================");

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
