// Skill tree spanning grades 1-4, indexed by skill_tag, pedagogical_style, difficulty_tier (1-15)
export const SKILLS = [
  // ─── ADDITION ───
  { id: 'add_within_10', label: 'Addition within 10', grade: 1, tier: 1, domain: 'arithmetic', prereqs: [] },
  { id: 'add_within_20', label: 'Addition within 20', grade: 1, tier: 2, domain: 'arithmetic', prereqs: ['add_within_10'] },
  { id: 'add_doubles', label: 'Doubles & Near-Doubles', grade: 1, tier: 3, domain: 'arithmetic', prereqs: ['add_within_20'] },
  { id: 'add_2digit_no_regroup', label: '2-Digit Addition (no regroup)', grade: 2, tier: 4, domain: 'arithmetic', prereqs: ['add_within_20'] },
  { id: 'add_2digit_regroup', label: '2-Digit Addition (regroup)', grade: 2, tier: 5, domain: 'arithmetic', prereqs: ['add_2digit_no_regroup'] },
  { id: 'add_mental_2digit', label: 'Mental 2-Digit Addition', grade: 2, tier: 6, domain: 'arithmetic', prereqs: ['add_2digit_regroup'] },
  { id: 'add_3digit', label: '3-Digit Addition', grade: 3, tier: 7, domain: 'arithmetic', prereqs: ['add_mental_2digit'] },

  // ─── SUBTRACTION ───
  { id: 'sub_within_10', label: 'Subtraction within 10', grade: 1, tier: 2, domain: 'arithmetic', prereqs: ['add_within_10'] },
  { id: 'sub_within_20', label: 'Subtraction within 20', grade: 1, tier: 3, domain: 'arithmetic', prereqs: ['sub_within_10'] },
  { id: 'sub_2digit', label: '2-Digit Subtraction', grade: 2, tier: 5, domain: 'arithmetic', prereqs: ['sub_within_20', 'add_2digit_no_regroup'] },
  { id: 'sub_mental', label: 'Mental Subtraction', grade: 2, tier: 6, domain: 'arithmetic', prereqs: ['sub_2digit'] },

  // ─── MULTIPLICATION ───
  { id: 'mult_concept', label: 'Multiplication Concept (groups)', grade: 2, tier: 6, domain: 'multiplication', prereqs: ['add_mental_2digit'] },
  { id: 'mult_2_5_10', label: 'Times Tables 2, 5, 10', grade: 2, tier: 7, domain: 'multiplication', prereqs: ['mult_concept'] },
  { id: 'mult_3_4', label: 'Times Tables 3 & 4', grade: 3, tier: 8, domain: 'multiplication', prereqs: ['mult_2_5_10'] },
  { id: 'mult_6_7_8_9', label: 'Times Tables 6-9', grade: 3, tier: 9, domain: 'multiplication', prereqs: ['mult_3_4'] },
  { id: 'mult_fluency', label: 'Multiplication Fluency (all facts)', grade: 3, tier: 10, domain: 'multiplication', prereqs: ['mult_6_7_8_9'] },
  { id: 'mult_2digit', label: '2-Digit × 1-Digit', grade: 3, tier: 11, domain: 'multiplication', prereqs: ['mult_fluency'] },

  // ─── ALGEBRA ───
  { id: 'alg_missing_addend', label: 'Missing Addend (__ + 4 = 9)', grade: 1, tier: 3, domain: 'algebra', prereqs: ['add_within_20'] },
  { id: 'alg_balance_eq', label: 'Balance Equations (x + 4 = 11)', grade: 2, tier: 6, domain: 'algebra', prereqs: ['alg_missing_addend', 'add_2digit_regroup'] },
  { id: 'alg_two_step', label: 'Two-Step Word Problems', grade: 2, tier: 7, domain: 'algebra', prereqs: ['alg_balance_eq'] },
  { id: 'alg_variables', label: 'Algebraic Variables (solve for x)', grade: 3, tier: 9, domain: 'algebra', prereqs: ['alg_two_step'] },

  // ─── PLACE VALUE ───
  { id: 'pv_tens_ones', label: 'Tens & Ones', grade: 1, tier: 2, domain: 'place_value', prereqs: [] },
  { id: 'pv_hundreds', label: 'Hundreds, Tens, Ones', grade: 2, tier: 4, domain: 'place_value', prereqs: ['pv_tens_ones'] },
  { id: 'pv_compare', label: 'Compare 3-Digit Numbers', grade: 2, tier: 5, domain: 'place_value', prereqs: ['pv_hundreds'] },
  { id: 'pv_thousands', label: 'Thousands', grade: 3, tier: 7, domain: 'place_value', prereqs: ['pv_compare'] },

  // ─── FRACTIONS ───
  { id: 'frac_concept', label: 'Fraction Concept (halves, thirds)', grade: 2, tier: 6, domain: 'fractions', prereqs: ['pv_compare'] },
  { id: 'frac_compare', label: 'Compare Fractions', grade: 3, tier: 8, domain: 'fractions', prereqs: ['frac_concept'] },
  { id: 'frac_add_same', label: 'Add Fractions (same denominator)', grade: 3, tier: 9, domain: 'fractions', prereqs: ['frac_compare'] },

  // ─── GEOMETRY / SPATIAL ───
  { id: 'geo_shapes', label: 'Shapes & Properties', grade: 1, tier: 2, domain: 'geometry', prereqs: [] },
  { id: 'geo_area', label: 'Area with Unit Squares', grade: 2, tier: 5, domain: 'geometry', prereqs: ['mult_concept'] },
  { id: 'geo_perimeter', label: 'Perimeter', grade: 3, tier: 7, domain: 'geometry', prereqs: ['geo_area', 'add_3digit'] },
  { id: 'geo_symmetry', label: 'Lines of Symmetry', grade: 3, tier: 8, domain: 'geometry', prereqs: ['geo_shapes'] },

  // ─── PATTERNS / LOGIC (Beast Academy style) ───
  { id: 'logic_patterns', label: 'Number Patterns & Rules', grade: 2, tier: 5, domain: 'logic', prereqs: ['add_2digit_regroup'] },
  { id: 'logic_matrix', label: 'Logic Matrices', grade: 3, tier: 8, domain: 'logic', prereqs: ['logic_patterns'] },
  { id: 'logic_spatial', label: 'Spatial Manipulation', grade: 3, tier: 9, domain: 'logic', prereqs: ['geo_symmetry'] },
]

// Question bank — each question may include a `visual` field for RSM/Beast Academy style concept teaching
export const QUESTIONS = [
  // ── add_within_10 — ten frames show the two addends as colored dots ──────────
  { id: 'q001', skill: 'add_within_10', style: 'drill', tier: 1, type: 'numeric',
    prompt: 'How many dots in all?', answer: 7, hints: [],
    visual: { type: 'tenframe', a: 3, b: 4 } },
  { id: 'q002', skill: 'add_within_10', style: 'drill', tier: 1, type: 'numeric',
    prompt: 'How many dots total?', answer: 8, hints: [],
    visual: { type: 'tenframe', a: 6, b: 2 } },
  { id: 'q003', skill: 'add_within_10', style: 'drill', tier: 1, type: 'numeric',
    prompt: 'Count all the dots.', answer: 10, hints: ['The frame is completely full!'],
    visual: { type: 'tenframe', a: 5, b: 5 } },
  { id: 'q004', skill: 'add_within_10', style: 'drill', tier: 1, type: 'numeric',
    prompt: 'How many dots in all?', answer: 8, hints: [],
    visual: { type: 'tenframe', a: 7, b: 1 } },
  { id: 'q005', skill: 'add_within_10', style: 'drill', tier: 1, type: 'numeric',
    prompt: 'Blue dots + pink dots = ?', answer: 8, hints: [],
    visual: { type: 'tenframe', a: 4, b: 4 } },

  // ── add_within_20 — double ten frame shows bridging through 10 ──────────────
  { id: 'q010', skill: 'add_within_20', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Count across both frames.', answer: 15, hints: ['Fill the first frame to 10, then count the rest'],
    visual: { type: 'tenframe', a: 8, b: 7 } },
  { id: 'q011', skill: 'add_within_20', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'How many dots total?', answer: 15, hints: [],
    visual: { type: 'tenframe', a: 9, b: 6 } },
  { id: 'q012', skill: 'add_within_20', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Count all the dots.', answer: 15, hints: ['10 in the first frame + how many in the second?'],
    visual: { type: 'tenframe', a: 7, b: 8 } },
  { id: 'q013', skill: 'add_within_20', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Blue + pink = ?', answer: 15, hints: [],
    visual: { type: 'tenframe', a: 6, b: 9 } },
  { id: 'q014', skill: 'add_within_20', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'How many dots in all?', answer: 16, hints: ['Both frames together'],
    visual: { type: 'tenframe', a: 8, b: 8 } },
  // Number line variant — shows the "counting on" strategy
  { id: 'q015', skill: 'add_within_20', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Start at 9 and hop forward 6. Where do you land?', answer: 15, hints: ['Count the hops: 10, 11, 12, 13, 14, 15'],
    visual: { type: 'numberline', min: 0, max: 20, hops: [{ from: 9, to: 15, color: '#60a5fa' }] } },
  { id: 'q016', skill: 'add_within_20', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Start at 7 and hop forward 8. Where do you land?', answer: 15, hints: [],
    visual: { type: 'numberline', min: 0, max: 20, hops: [{ from: 7, to: 15, color: '#f472b6' }] } },

  // ── add_doubles — doubles shown visually to build fluency ───────────────────
  { id: 'q020', skill: 'add_doubles', style: 'drill', tier: 3, type: 'numeric',
    prompt: '7 + 7 = ?  (two equal groups!)', answer: 14, hints: [],
    visual: { type: 'tenframe', a: 7, b: 7 } },
  { id: 'q021', skill: 'add_doubles', style: 'drill', tier: 3, type: 'numeric',
    prompt: '6 + 7 = ?  (near-double: one more than 6+6)', answer: 13, hints: ['6+6=12, then +1 more'],
    visual: { type: 'tenframe', a: 6, b: 7 } },
  { id: 'q022', skill: 'add_doubles', style: 'drill', tier: 3, type: 'numeric',
    prompt: '9 + 8 = ?  (near-double: one less than 9+9)', answer: 17, hints: ['9+9=18, then -1'],
    visual: { type: 'tenframe', a: 9, b: 8 } },
  { id: 'q023', skill: 'add_doubles', style: 'drill', tier: 3, type: 'numeric',
    prompt: '8 + 8 = ?', answer: 16, hints: ['Double 8!'],
    visual: { type: 'tenframe', a: 8, b: 8 } },
  { id: 'q024', skill: 'add_doubles', style: 'drill', tier: 3, type: 'numeric',
    prompt: '6 + 6 = ?', answer: 12, hints: [],
    visual: { type: 'tenframe', a: 6, b: 6 } },

  // ── add_2digit_no_regroup ────────────────────────────────────────────────────
  { id: 'q050', skill: 'add_2digit_no_regroup', style: 'drill', tier: 4, type: 'numeric',
    prompt: '23 + 14 = ?', answer: 37, hints: ['Add tens: 20+10=30. Add ones: 3+4=7. Total: 37'] },
  { id: 'q051', skill: 'add_2digit_no_regroup', style: 'drill', tier: 4, type: 'numeric',
    prompt: '41 + 35 = ?', answer: 76, hints: [] },
  { id: 'q052', skill: 'add_2digit_no_regroup', style: 'drill', tier: 4, type: 'numeric',
    prompt: '52 + 27 = ?', answer: 79, hints: [] },
  { id: 'q053', skill: 'add_2digit_no_regroup', style: 'drill', tier: 4, type: 'numeric',
    prompt: 'The blocks show 32 + 15. What is the total?', answer: 47, hints: ['3 tens + 1 ten = 4 tens. 2 ones + 5 ones = 7 ones'],
    visual: { type: 'pvblocks', tens: 3, ones: 2 } },

  // ── add_2digit_regroup ───────────────────────────────────────────────────────
  { id: 'q060', skill: 'add_2digit_regroup', style: 'drill', tier: 5, type: 'numeric',
    prompt: '47 + 38 = ?', answer: 85, hints: ['Regroup: 7+8=15, write 5 carry 1'] },
  { id: 'q061', skill: 'add_2digit_regroup', style: 'drill', tier: 5, type: 'numeric',
    prompt: '65 + 28 = ?', answer: 93, hints: [] },
  { id: 'q062', skill: 'add_2digit_regroup', style: 'drill', tier: 5, type: 'numeric',
    prompt: '59 + 36 = ?', answer: 95, hints: [] },

  // ── add_mental_2digit ────────────────────────────────────────────────────────
  { id: 'q070', skill: 'add_mental_2digit', style: 'drill', tier: 6, type: 'numeric',
    prompt: '37 + 46 = ?', answer: 83, hints: ['Try: 37+40=77, then +6'],
    visual: { type: 'numberline', min: 30, max: 90, hops: [{ from: 37, to: 77, color: '#60a5fa' }, { from: 77, to: 83, color: '#34d399' }] } },
  { id: 'q071', skill: 'add_mental_2digit', style: 'drill', tier: 6, type: 'numeric',
    prompt: '58 + 35 = ?', answer: 93, hints: [] },
  { id: 'q072', skill: 'add_mental_2digit', style: 'drill', tier: 6, type: 'numeric',
    prompt: '64 + 29 = ?', answer: 93, hints: ['Try: 64+30=94, then -1'],
    visual: { type: 'numberline', min: 55, max: 100, hops: [{ from: 64, to: 94, color: '#f472b6' }, { from: 94, to: 93, color: '#f87171' }] } },

  // ── add_3digit ───────────────────────────────────────────────────────────────
  { id: 'q080', skill: 'add_3digit', style: 'drill', tier: 7, type: 'numeric', prompt: '247 + 135 = ?', answer: 382, hints: [] },
  { id: 'q081', skill: 'add_3digit', style: 'drill', tier: 7, type: 'numeric', prompt: '364 + 258 = ?', answer: 622, hints: [] },

  // ── sub_within_10 — ten frame with crossed-out dots shows "take away" ────────
  { id: 'q030', skill: 'sub_within_10', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Cross out 4 dots. How many are left?', answer: 5, hints: [],
    visual: { type: 'tenframe', a: 9, b: 4, mode: 'subtract' } },
  { id: 'q031', skill: 'sub_within_10', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Remove 3 dots. How many remain?', answer: 5, hints: [],
    visual: { type: 'tenframe', a: 8, b: 3, mode: 'subtract' } },
  { id: 'q032', skill: 'sub_within_10', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'Take away the crossed-out dots. How many are left?', answer: 4, hints: [],
    visual: { type: 'tenframe', a: 10, b: 6, mode: 'subtract' } },
  { id: 'q033', skill: 'sub_within_10', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'How many dots are NOT crossed out?', answer: 3, hints: [],
    visual: { type: 'tenframe', a: 7, b: 4, mode: 'subtract' } },

  // ── sub_within_20 — double ten frame with cross-outs ─────────────────────────
  { id: 'q040', skill: 'sub_within_20', style: 'drill', tier: 3, type: 'numeric',
    prompt: 'Cross out 7. How many blue dots remain?', answer: 8, hints: ['15 total, take away 7'],
    visual: { type: 'tenframe', a: 15, b: 7, mode: 'subtract' } },
  { id: 'q041', skill: 'sub_within_20', style: 'drill', tier: 3, type: 'numeric',
    prompt: 'Remove the crossed-out dots. How many left?', answer: 7, hints: [],
    visual: { type: 'tenframe', a: 16, b: 9, mode: 'subtract' } },
  { id: 'q042', skill: 'sub_within_20', style: 'drill', tier: 3, type: 'numeric',
    prompt: 'How many dots remain after removing the crossed-out ones?', answer: 8, hints: [],
    visual: { type: 'tenframe', a: 14, b: 6, mode: 'subtract' } },
  { id: 'q043', skill: 'sub_within_20', style: 'drill', tier: 3, type: 'numeric',
    prompt: 'Start at 18, hop back 9. Where do you land?', answer: 9, hints: ['Count the hops backwards'],
    visual: { type: 'numberline', min: 0, max: 20, hops: [{ from: 18, to: 9, color: '#f87171' }] } },

  // ── sub_2digit ───────────────────────────────────────────────────────────────
  { id: 'q090', skill: 'sub_2digit', style: 'drill', tier: 5, type: 'numeric', prompt: '73 - 28 = ?', answer: 45, hints: ['Regroup: borrow from tens'] },
  { id: 'q091', skill: 'sub_2digit', style: 'drill', tier: 5, type: 'numeric', prompt: '85 - 47 = ?', answer: 38, hints: [] },
  { id: 'q092', skill: 'sub_2digit', style: 'drill', tier: 5, type: 'numeric', prompt: '62 - 39 = ?', answer: 23, hints: [] },

  // ── sub_mental ───────────────────────────────────────────────────────────────
  { id: 'q095', skill: 'sub_mental', style: 'drill', tier: 6, type: 'numeric',
    prompt: '91 - 37 = ?', answer: 54, hints: ['Try: 91-40=51, then +3'],
    visual: { type: 'numberline', min: 45, max: 95, hops: [{ from: 91, to: 51, color: '#f87171' }, { from: 51, to: 54, color: '#34d399' }] } },
  { id: 'q096', skill: 'sub_mental', style: 'drill', tier: 6, type: 'numeric', prompt: '74 - 28 = ?', answer: 46, hints: [] },

  // ── mult_concept — array grid makes "groups of" visual ──────────────────────
  { id: 'q100', skill: 'mult_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'How many dots in all? (count all the groups)', answer: 12, hints: ['Count the groups: each row is a group of 4'],
    visual: { type: 'array', rows: 3, cols: 4 } },
  { id: 'q101', skill: 'mult_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'Count all the dots in the array.', answer: 10, hints: ['5 groups, each group has 2'],
    visual: { type: 'array', rows: 5, cols: 2 } },
  { id: 'q102', skill: 'mult_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'How many dots total?', answer: 12, hints: ['4 rows of 3'],
    visual: { type: 'array', rows: 4, cols: 3 } },
  { id: 'q103', skill: 'mult_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'How many dots? (2 groups of 6)', answer: 12, hints: ['Add the two groups: 6 + 6'],
    visual: { type: 'array', rows: 2, cols: 6 } },
  { id: 'q104', skill: 'mult_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: '3 bags of bolts, 5 bolts each. How many bolts total?', answer: 15, hints: ['3 groups of 5'],
    visual: { type: 'array', rows: 3, cols: 5 } },

  // ── mult_2_5_10 ──────────────────────────────────────────────────────────────
  { id: 'q110', skill: 'mult_2_5_10', style: 'drill', tier: 7, type: 'numeric', prompt: '6 × 2 = ?', answer: 12, hints: [] },
  { id: 'q111', skill: 'mult_2_5_10', style: 'drill', tier: 7, type: 'numeric', prompt: '7 × 5 = ?', answer: 35, hints: [] },
  { id: 'q112', skill: 'mult_2_5_10', style: 'drill', tier: 7, type: 'numeric', prompt: '8 × 10 = ?', answer: 80, hints: [] },
  { id: 'q113', skill: 'mult_2_5_10', style: 'drill', tier: 7, type: 'numeric', prompt: '9 × 2 = ?', answer: 18, hints: [],
    visual: { type: 'array', rows: 9, cols: 2 } },
  { id: 'q114', skill: 'mult_2_5_10', style: 'drill', tier: 7, type: 'numeric', prompt: '6 × 5 = ?', answer: 30, hints: [] },

  // ── mult_3_4 ─────────────────────────────────────────────────────────────────
  { id: 'q120', skill: 'mult_3_4', style: 'drill', tier: 8, type: 'numeric', prompt: '6 × 3 = ?', answer: 18, hints: [] },
  { id: 'q121', skill: 'mult_3_4', style: 'drill', tier: 8, type: 'numeric', prompt: '7 × 4 = ?', answer: 28, hints: [] },
  { id: 'q122', skill: 'mult_3_4', style: 'drill', tier: 8, type: 'numeric', prompt: '8 × 3 = ?', answer: 24, hints: [] },
  { id: 'q123', skill: 'mult_3_4', style: 'drill', tier: 8, type: 'numeric', prompt: '9 × 4 = ?', answer: 36, hints: [] },

  // ── mult_6_7_8_9 ─────────────────────────────────────────────────────────────
  { id: 'q130', skill: 'mult_6_7_8_9', style: 'drill', tier: 9, type: 'numeric', prompt: '7 × 6 = ?', answer: 42, hints: [] },
  { id: 'q131', skill: 'mult_6_7_8_9', style: 'drill', tier: 9, type: 'numeric', prompt: '8 × 7 = ?', answer: 56, hints: [] },
  { id: 'q132', skill: 'mult_6_7_8_9', style: 'drill', tier: 9, type: 'numeric', prompt: '9 × 8 = ?', answer: 72, hints: [] },
  { id: 'q133', skill: 'mult_6_7_8_9', style: 'drill', tier: 9, type: 'numeric', prompt: '6 × 9 = ?', answer: 54, hints: [] },

  // ── mult_2digit ───────────────────────────────────────────────────────────────
  { id: 'q140', skill: 'mult_2digit', style: 'drill', tier: 11, type: 'numeric', prompt: '14 × 3 = ?', answer: 42, hints: ['10×3=30, 4×3=12, total?'] },
  { id: 'q141', skill: 'mult_2digit', style: 'drill', tier: 11, type: 'numeric', prompt: '23 × 4 = ?', answer: 92, hints: [] },

  // ── alg_missing_addend — number bond shows the part-part-whole relationship ──
  { id: 'q200', skill: 'alg_missing_addend', style: 'equation', tier: 3, type: 'numeric',
    prompt: 'The whole is 9. One part is 3. What is the missing part?', answer: 6, hints: ['9 - 3 = ?'],
    visual: { type: 'numberbond', whole: 9, partA: null, partB: 3 } },
  { id: 'q201', skill: 'alg_missing_addend', style: 'equation', tier: 3, type: 'numeric',
    prompt: 'The whole is 12. One part is 5. Find the missing part.', answer: 7, hints: ['12 - 5 = ?'],
    visual: { type: 'numberbond', whole: 12, partA: 5, partB: null } },
  { id: 'q202', skill: 'alg_missing_addend', style: 'equation', tier: 3, type: 'numeric',
    prompt: 'The whole is 17. One part is 8. What is the other part?', answer: 9, hints: ['17 - 8 = ?'],
    visual: { type: 'numberbond', whole: 17, partA: null, partB: 8 } },
  { id: 'q203', skill: 'alg_missing_addend', style: 'equation', tier: 3, type: 'numeric',
    prompt: 'The whole is 15. One part is 9. Find the missing part.', answer: 6, hints: ['15 - 9 = ?'],
    visual: { type: 'numberbond', whole: 15, partA: null, partB: 9 } },
  { id: 'q204', skill: 'alg_missing_addend', style: 'equation', tier: 3, type: 'numeric',
    prompt: 'The whole is 20. One part is 13. Find the other part.', answer: 7, hints: ['20 - 13 = ?'],
    visual: { type: 'numberbond', whole: 20, partA: 13, partB: null } },

  // ── alg_balance_eq — balance scale makes equations visual ───────────────────
  { id: 'q210', skill: 'alg_balance_eq', style: 'equation', tier: 6, type: 'numeric',
    prompt: 'The scale must balance! What is x?', answer: 7, hints: ['11 - 4 = ?'],
    visual: { type: 'balance', leftLabel: 'x + 4', rightLabel: '11' } },
  { id: 'q211', skill: 'alg_balance_eq', style: 'equation', tier: 6, type: 'numeric',
    prompt: 'Balance the scale. What is x?', answer: 8, hints: ['23 - 15 = ?'],
    visual: { type: 'balance', leftLabel: 'x + 15', rightLabel: '23' } },
  { id: 'q212', skill: 'alg_balance_eq', style: 'equation', tier: 6, type: 'numeric',
    prompt: 'Find x to balance the scale.', answer: 15, hints: ['Add 6 to both sides!'],
    visual: { type: 'balance', leftLabel: 'x − 6', rightLabel: '9' } },
  { id: 'q213', skill: 'alg_balance_eq', style: 'equation', tier: 6, type: 'numeric',
    prompt: 'What value of x balances the scale?', answer: 6, hints: ['18 ÷ 3 = ?'],
    visual: { type: 'balance', leftLabel: '3 × x', rightLabel: '18' } },

  // ── alg_two_step ─────────────────────────────────────────────────────────────
  { id: 'q220', skill: 'alg_two_step', style: 'word', tier: 7, type: 'numeric',
    prompt: 'Rex earns 8 bolts, spends 3, then earns 5 more. How many bolts does he have?', answer: 10, hints: ['Step 1: 8-3=? Step 2: add 5'] },
  { id: 'q221', skill: 'alg_two_step', style: 'word', tier: 7, type: 'numeric',
    prompt: 'A rocket has 24 screws. 9 fall off during launch. Then 6 are added. How many screws now?', answer: 21, hints: [] },

  // ── alg_variables ────────────────────────────────────────────────────────────
  { id: 'q230', skill: 'alg_variables', style: 'equation', tier: 9, type: 'numeric',
    prompt: '2x + 3 = 11\nx = ?', answer: 4, hints: ['First: 11-3=8, then 8÷2=?'],
    visual: { type: 'balance', leftLabel: '2x + 3', rightLabel: '11' } },
  { id: 'q231', skill: 'alg_variables', style: 'equation', tier: 9, type: 'numeric',
    prompt: '3x - 4 = 14\nx = ?', answer: 6, hints: ['First: 14+4=18, then 18÷3=?'],
    visual: { type: 'balance', leftLabel: '3x − 4', rightLabel: '14' } },

  // ── pv_tens_ones — place value blocks make the structure visible ─────────────
  { id: 'q300', skill: 'pv_tens_ones', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'How many TENS are in this number?', answer: 4, hints: ['Count the green rods'],
    visual: { type: 'pvblocks', tens: 4, ones: 7 } },
  { id: 'q301', skill: 'pv_tens_ones', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'What number do these blocks show?', answer: 63, hints: ['Tens × 10 + ones'],
    visual: { type: 'pvblocks', tens: 6, ones: 3 } },
  { id: 'q302', skill: 'pv_tens_ones', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'What number do these blocks make?', answer: 25, hints: ['2 tens = 20, plus 5 ones'],
    visual: { type: 'pvblocks', tens: 2, ones: 5 } },
  { id: 'q303', skill: 'pv_tens_ones', style: 'drill', tier: 2, type: 'numeric',
    prompt: 'What number do these blocks show?', answer: 48, hints: [],
    visual: { type: 'pvblocks', tens: 4, ones: 8 } },

  // ── pv_hundreds ──────────────────────────────────────────────────────────────
  { id: 'q310', skill: 'pv_hundreds', style: 'drill', tier: 4, type: 'numeric',
    prompt: 'What number do these blocks show?', answer: 357, hints: ['hundreds + tens + ones'],
    visual: { type: 'pvblocks', hundreds: 3, tens: 5, ones: 7 } },
  { id: 'q311', skill: 'pv_hundreds', style: 'drill', tier: 4, type: 'numeric',
    prompt: 'What is the hundreds digit in this number?', answer: 8, hints: ['Count the yellow squares'],
    visual: { type: 'pvblocks', hundreds: 8, tens: 3, ones: 9 } },
  { id: 'q312', skill: 'pv_hundreds', style: 'drill', tier: 4, type: 'numeric',
    prompt: 'What number do these blocks represent?', answer: 204, hints: ['2 hundreds + 0 tens + 4 ones'],
    visual: { type: 'pvblocks', hundreds: 2, tens: 0, ones: 4 } },

  // ── pv_compare ───────────────────────────────────────────────────────────────
  { id: 'q320', skill: 'pv_compare', style: 'choice', tier: 5, type: 'choice', prompt: 'Which is bigger: 482 or 428?', choices: ['482', '428'], answer: '482', hints: [] },
  { id: 'q321', skill: 'pv_compare', style: 'choice', tier: 5, type: 'choice', prompt: 'Which is smaller: 601 or 610?', choices: ['601', '610'], answer: '601', hints: [] },

  // ── pv_thousands ─────────────────────────────────────────────────────────────
  { id: 'q330', skill: 'pv_thousands', style: 'drill', tier: 7, type: 'numeric', prompt: '2000 + 300 + 50 + 4 = ?', answer: 2354, hints: [] },

  // ── frac_concept — fraction bar makes the "equal parts" idea concrete ─────────
  { id: 'q400', skill: 'frac_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'The shaded part shows a fraction. What is the numerator (top number)?', answer: 1, hints: ['1 colored part out of 4 total'],
    visual: { type: 'fracbar', total: 4, filled: 1, color: '#f43f5e' } },
  { id: 'q401', skill: 'frac_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'How many parts are shaded? That is the top number of the fraction.', answer: 3, hints: ['3 out of 6 = 3/6 = 1/2'],
    visual: { type: 'fracbar', total: 6, filled: 3, color: '#8b5cf6' } },
  { id: 'q402', skill: 'frac_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'A bar is split into 3 equal parts. 1 is colored. What is the denominator (bottom number)?', answer: 3, hints: ['How many equal parts total?'],
    visual: { type: 'fracbar', total: 3, filled: 1, color: '#f59e0b' } },
  { id: 'q403', skill: 'frac_concept', style: 'word', tier: 6, type: 'numeric',
    prompt: 'How many parts are NOT shaded?', answer: 3, hints: ['Total parts − shaded parts'],
    visual: { type: 'fracbar', total: 5, filled: 2, color: '#06b6d4' } },

  // ── frac_compare ─────────────────────────────────────────────────────────────
  { id: 'q410', skill: 'frac_compare', style: 'choice', tier: 8, type: 'choice', prompt: 'Which is bigger: 3/4 or 2/4?', choices: ['3/4', '2/4'], answer: '3/4', hints: ['Same bottom number – bigger top wins!'] },
  { id: 'q411', skill: 'frac_compare', style: 'choice', tier: 8, type: 'choice', prompt: 'Which is bigger: 1/2 or 1/3?', choices: ['1/2', '1/3'], answer: '1/2', hints: ['Same piece count – bigger slice wins!'] },

  // ── frac_add_same ────────────────────────────────────────────────────────────
  { id: 'q420', skill: 'frac_add_same', style: 'drill', tier: 9, type: 'numeric', prompt: '2/5 + 1/5 = ?/5\nEnter the numerator.', answer: 3, hints: ['Add the top numbers: 2+1'] },
  { id: 'q421', skill: 'frac_add_same', style: 'drill', tier: 9, type: 'numeric', prompt: '3/8 + 4/8 = ?/8\nEnter the numerator.', answer: 7, hints: [] },

  // ── geo_shapes ───────────────────────────────────────────────────────────────
  { id: 'q500', skill: 'geo_shapes', style: 'choice', tier: 2, type: 'choice', prompt: 'How many sides does a hexagon have?', choices: ['5', '6', '7', '8'], answer: '6', hints: ['Hex = 6!'] },
  { id: 'q501', skill: 'geo_shapes', style: 'numeric', tier: 2, type: 'numeric', prompt: 'A triangle has how many corners?', answer: 3, hints: [] },

  // ── geo_area — array grid visualizes area as counting unit squares ────────────
  { id: 'q510', skill: 'geo_area', style: 'word', tier: 5, type: 'numeric',
    prompt: 'Count the square units to find the area. How many square units?', answer: 20, hints: ['Rows × columns = area'],
    visual: { type: 'array', rows: 4, cols: 5, highlightGroup: false } },
  { id: 'q511', skill: 'geo_area', style: 'word', tier: 5, type: 'numeric',
    prompt: 'Each dot is one square unit. What is the area?', answer: 18, hints: ['6 × 3 = ?'],
    visual: { type: 'array', rows: 3, cols: 6, highlightGroup: false } },

  // ── geo_perimeter ─────────────────────────────────────────────────────────────
  { id: 'q520', skill: 'geo_perimeter', style: 'word', tier: 7, type: 'numeric', prompt: 'A square has sides of 8 cm. What is its perimeter?', answer: 32, hints: ['Perimeter = 4 × side'] },
  { id: 'q521', skill: 'geo_perimeter', style: 'word', tier: 7, type: 'numeric', prompt: 'A rectangle is 9 cm long and 5 cm wide. Perimeter?', answer: 28, hints: ['Add all 4 sides: 9+9+5+5'] },

  // ── logic_patterns — pattern sequence shows the rule visually ────────────────
  { id: 'q600', skill: 'logic_patterns', style: 'pattern', tier: 5, type: 'numeric',
    prompt: 'What number comes next?', answer: 15, hints: ['Add 3 each time!'],
    visual: { type: 'pattern', sequence: [3, 6, 9, 12, null], rule: '+3 each time' } },
  { id: 'q601', skill: 'logic_patterns', style: 'pattern', tier: 5, type: 'numeric',
    prompt: 'What number comes next?', answer: 32, hints: ['Double each time!'],
    visual: { type: 'pattern', sequence: [2, 4, 8, 16, null], rule: '×2 each time' } },
  { id: 'q602', skill: 'logic_patterns', style: 'pattern', tier: 5, type: 'numeric',
    prompt: 'What number comes next?', answer: 60, hints: ['Subtract 10 each time'],
    visual: { type: 'pattern', sequence: [100, 90, 80, 70, null], rule: '−10 each time' } },
  { id: 'q603', skill: 'logic_patterns', style: 'pattern', tier: 6, type: 'numeric',
    prompt: 'What number comes next?', answer: 80, hints: ['×2 each step'],
    visual: { type: 'pattern', sequence: [5, 10, 20, 40, null], rule: '×2 each time' } },
  { id: 'q604', skill: 'logic_patterns', style: 'pattern', tier: 5, type: 'numeric',
    prompt: 'What number comes next?', answer: 25, hints: ['Add 5 each time'],
    visual: { type: 'pattern', sequence: [5, 10, 15, 20, null], rule: '+5 each time' } },
  { id: 'q605', skill: 'logic_patterns', style: 'pattern', tier: 6, type: 'numeric',
    prompt: 'What number comes next?', answer: 48, hints: ['×2 each time'],
    visual: { type: 'pattern', sequence: [3, 6, 12, 24, null], rule: '×2 each time' } },

  // ── logic_matrix ─────────────────────────────────────────────────────────────
  { id: 'q610', skill: 'logic_matrix', style: 'word', tier: 8, type: 'choice',
    prompt: 'Row 1: 2, 4, 6\nRow 2: 3, 6, 9\nRow 3: 4, ?, 12\nWhat is "?"',
    choices: ['6', '7', '8', '9'], answer: '8', hints: ['Each row multiplies by position'] },
  { id: 'q611', skill: 'logic_matrix', style: 'word', tier: 8, type: 'numeric',
    prompt: 'Each row sums to 15:\nRow 1: 4 + 5 + 6 = 15 ✓\nRow 2: 3 + __ + 7 = 15\nFill in the blank.', answer: 5, hints: ['15 - 3 - 7 = ?'] },

  // ── logic_spatial ─────────────────────────────────────────────────────────────
  { id: 'q620', skill: 'logic_spatial', style: 'word', tier: 9, type: 'choice',
    prompt: 'A shape is reflected over a vertical line. If the left wing points UP-LEFT, which way does the reflected right wing point?',
    choices: ['UP-LEFT', 'UP-RIGHT', 'DOWN-LEFT', 'DOWN-RIGHT'], answer: 'UP-RIGHT', hints: ['Reflection flips left↔right'] },

  // ── geo_symmetry ─────────────────────────────────────────────────────────────
  { id: 'q630', skill: 'geo_symmetry', style: 'choice', tier: 8, type: 'numeric', prompt: 'How many lines of symmetry does a square have?', answer: 4, hints: ['Count: horizontal, vertical, and two diagonal'] },

  // ── BOSS LEVEL QUESTIONS ──────────────────────────────────────────────────────
  { id: 'boss001', skill: 'mult_2_5_10', style: 'boss', tier: 7, type: 'numeric',
    prompt: '🔥 BOSS CHALLENGE: Rex builds rockets. Each rocket needs 5 bolts. He has 47 bolts. How many complete rockets can he build?', answer: 9, hints: ['47 ÷ 5 = 9 remainder 2'] },
  { id: 'boss002', skill: 'alg_balance_eq', style: 'boss', tier: 8, type: 'numeric',
    prompt: '🔥 BOSS CHALLENGE: Balance the scale to find the robot\'s weight. Robot + 4 kg gear = two 8 kg weights.\nx + 4 = 16, so x = ?', answer: 12, hints: ['16 - 4 = ?'],
    visual: { type: 'balance', leftLabel: 'x + 4', rightLabel: '16' } },
  { id: 'boss003', skill: 'logic_patterns', style: 'boss', tier: 9, type: 'numeric',
    prompt: '🔥 BOSS CHALLENGE: A machine doubles its output each hour.\n1 → 2 → 4 → 8 → 16 bricks\nHow many bricks TOTAL after 5 hours?', answer: 31, hints: ['1+2+4+8+16=?'],
    visual: { type: 'pattern', sequence: [1, 2, 4, 8, 16], rule: '×2 each hour' } },
  { id: 'boss004', skill: 'geo_area', style: 'boss', tier: 10, type: 'numeric',
    prompt: '🔥 BOSS CHALLENGE: Lab floor = 12 × 8 units. A machine takes 3×3 units. How many free floor units remain?', answer: 87, hints: ['Total area - machine area: (12×8)-(3×3)'] },
]

// Initial skills to unlock for a rising 2nd grader
// (mastery.js will bootstrap add/sub within 20 as pre-mastered so the cascade unlocks appropriate next skills)
export const STARTER_SKILLS = ['add_within_10', 'sub_within_10', 'pv_tens_ones', 'geo_shapes']

// Skill domains for the map display
export const DOMAINS = {
  arithmetic: { label: 'Arithmetic', color: '#f59e0b', icon: '➕' },
  multiplication: { label: 'Multiplication', color: '#8b5cf6', icon: '✖️' },
  algebra: { label: 'Algebra', color: '#06b6d4', icon: '⚖️' },
  place_value: { label: 'Place Value', color: '#10b981', icon: '🔢' },
  fractions: { label: 'Fractions', color: '#f43f5e', icon: '½' },
  geometry: { label: 'Geometry', color: '#3b82f6', icon: '📐' },
  logic: { label: 'Logic & Patterns', color: '#ec4899', icon: '🧩' },
}
