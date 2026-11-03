// server/validation.js
// Server-side input validation middleware for CLUS

const VALID_ROOM_TYPES = ['Classroom', 'Lab', 'Lecture Hall'];
const VALID_DESIGNATIONS = ['Professor', 'Associate Professor', 'Assistant Professor', 'Adjunct Lecturer'];
const VALID_THEORY_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECTION_REGEX = /^[A-Z]$/i;
const COURSE_CODE_REGEX = /^[A-Z0-9]{8}[TPJ]$/i;

/**
 * Validates Room input for POST and PUT requests
 */
export function validateRoom(req, res, next) {
  const isPost = req.method === 'POST';
  const { room_number, room_type, capacity } = req.body;

  if (isPost) {
    if (!room_number || typeof room_number !== 'string' || !room_number.trim()) {
      return res.status(400).json({ error: 'Validation Error: Room number is required and must be a valid string.' });
    }
    const cleanRoom = room_number.trim();
    if (cleanRoom.length > 20 || !/^[A-Za-z0-9_-]+$/.test(cleanRoom)) {
      return res.status(400).json({ error: 'Validation Error: Room number must be 1-20 alphanumeric characters (hyphens and underscores allowed).' });
    }
  }

  if (!room_type || !VALID_ROOM_TYPES.includes(room_type)) {
    return res.status(400).json({ 
      error: `Validation Error: Invalid room type "${room_type}". Allowed types are: ${VALID_ROOM_TYPES.join(', ')}.` 
    });
  }

  const parsedCap = Number(capacity);
  if (!Number.isInteger(parsedCap) || parsedCap <= 0 || parsedCap > 10000) {
    return res.status(400).json({ 
      error: 'Validation Error: Room capacity must be a positive integer between 1 and 10,000.' 
    });
  }

  next();
}

/**
 * Validates Batch input for POST and PUT requests
 */
export function validateBatch(req, res, next) {
  const isPost = req.method === 'POST';
  const { batch_id, year_of_study, section, student_count, dept_id } = req.body;

  if (isPost) {
    const parsedBatchId = Number(batch_id);
    if (!Number.isInteger(parsedBatchId) || parsedBatchId <= 0) {
      return res.status(400).json({ error: 'Validation Error: Batch ID must be a positive integer.' });
    }
  }

  const parsedYear = Number(year_of_study);
  if (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 5) {
    return res.status(400).json({ error: 'Validation Error: Year of study must be an integer between 1 and 5.' });
  }

  if (!section || typeof section !== 'string' || !SECTION_REGEX.test(section.trim())) {
    return res.status(400).json({ error: 'Validation Error: Section must be a single uppercase letter (A-Z).' });
  }

  const parsedStudents = Number(student_count);
  if (!Number.isInteger(parsedStudents) || parsedStudents <= 0 || parsedStudents > 10000) {
    return res.status(400).json({ error: 'Validation Error: Student count must be a positive integer between 1 and 10,000.' });
  }

  const parsedDeptId = Number(dept_id);
  if (!Number.isInteger(parsedDeptId) || parsedDeptId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Department ID must be a valid positive integer.' });
  }

  next();
}

/**
 * Validates Department input for POST requests
 */
export function validateDepartment(req, res, next) {
  const { dept_id, dept_name } = req.body;

  const parsedDeptId = Number(dept_id);
  if (!Number.isInteger(parsedDeptId) || parsedDeptId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Department ID must be a positive integer.' });
  }

  if (!dept_name || typeof dept_name !== 'string' || dept_name.trim().length < 2 || dept_name.trim().length > 100) {
    return res.status(400).json({ error: 'Validation Error: Department name must be between 2 and 100 characters.' });
  }

  next();
}

/**
 * Validates Course input for POST requests (Enforces exact 9 chars ending in T, P, or J)
 */
export function validateCourse(req, res, next) {
  const { course_id, course_code, course_name, dept_id } = req.body;

  const parsedCourseId = Number(course_id);
  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Course ID must be a positive integer.' });
  }

  if (!course_code || typeof course_code !== 'string' || !COURSE_CODE_REGEX.test(course_code.trim())) {
    return res.status(400).json({ 
      error: 'Validation Error: Course code must be exactly 9 alphanumeric characters ending with T (Theory), P (Practical), or J (Joint).' 
    });
  }

  if (!course_name || typeof course_name !== 'string' || course_name.trim().length < 2 || course_name.trim().length > 100) {
    return res.status(400).json({ error: 'Validation Error: Course name must be between 2 and 100 characters.' });
  }

  const parsedDeptId = Number(dept_id);
  if (!Number.isInteger(parsedDeptId) || parsedDeptId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Department ID must be a valid positive integer.' });
  }

  next();
}

/**
 * Validates Faculty input for POST and PUT requests
 */
export function validateFaculty(req, res, next) {
  const isPost = req.method === 'POST';
  const { faculty_id, faculty_name, email, dept_id, designation, max_weekly_slots } = req.body;

  if (isPost) {
    const parsedFacultyId = Number(faculty_id);
    if (!Number.isInteger(parsedFacultyId) || parsedFacultyId <= 0) {
      return res.status(400).json({ error: 'Validation Error: Faculty ID must be a positive integer.' });
    }
  }

  if (!faculty_name || typeof faculty_name !== 'string' || faculty_name.trim().length < 2 || faculty_name.trim().length > 100) {
    return res.status(400).json({ error: 'Validation Error: Faculty name must be between 2 and 100 characters.' });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Validation Error: A valid email address is required.' });
  }

  const parsedDeptId = Number(dept_id);
  if (!Number.isInteger(parsedDeptId) || parsedDeptId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Department ID must be a valid positive integer.' });
  }

  if (!designation || !VALID_DESIGNATIONS.includes(designation)) {
    return res.status(400).json({ 
      error: `Validation Error: Designation must be one of: ${VALID_DESIGNATIONS.join(', ')}.` 
    });
  }

  const parsedSlots = Number(max_weekly_slots !== undefined ? max_weekly_slots : 16);
  if (!Number.isInteger(parsedSlots) || parsedSlots <= 0 || parsedSlots > 30) {
    return res.status(400).json({ error: 'Validation Error: Max weekly slots must be an integer between 1 and 30.' });
  }

  next();
}

/**
 * Validates Schedule input for POST and PUT requests
 */
export function validateSchedule(req, res, next) {
  const { course_id, batch_id, room_number, slot_id, slot_ids, faculty_id } = req.body;

  const parsedCourseId = Number(course_id);
  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Valid Course selection is required.' });
  }

  const parsedBatchId = Number(batch_id);
  if (!Number.isInteger(parsedBatchId) || parsedBatchId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Valid Batch selection is required.' });
  }

  if (!room_number || typeof room_number !== 'string' || !room_number.trim()) {
    return res.status(400).json({ error: 'Validation Error: Valid Room selection is required.' });
  }

  // Handle either single slot_id or slot_ids array (for lab pairs)
  if (Array.isArray(slot_ids)) {
    if (slot_ids.length === 0 || slot_ids.length > 2) {
      return res.status(400).json({ error: 'Validation Error: Lab slot allocations cannot exceed 2 slots at once.' });
    }
    for (const sid of slot_ids) {
      const num = Number(sid);
      if (!Number.isInteger(num) || num <= 0 || num > 50) {
        return res.status(400).json({ error: 'Validation Error: Each time slot ID must be between 1 and 50.' });
      }
    }
  } else {
    const parsedSlotId = Number(slot_id);
    if (!Number.isInteger(parsedSlotId) || parsedSlotId <= 0 || parsedSlotId > 50) {
      return res.status(400).json({ error: 'Validation Error: Time slot ID must be a valid slot between 1 and 50.' });
    }
  }

  if (faculty_id !== undefined && faculty_id !== null && faculty_id !== '') {
    const parsedFacultyId = Number(faculty_id);
    if (!Number.isInteger(parsedFacultyId) || parsedFacultyId <= 0) {
      return res.status(400).json({ error: 'Validation Error: Valid Faculty selection is required.' });
    }
  }

  next();
}

/**
 * Validates Clubbed Theory Schedule input (e.g. Slot A, B, C, D, E, F, G)
 */
export function validateClubbedSchedule(req, res, next) {
  const { course_id, batch_id, room_number, slot_name, faculty_id } = req.body;

  const parsedCourseId = Number(course_id);
  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Valid Course selection is required.' });
  }

  const parsedBatchId = Number(batch_id);
  if (!Number.isInteger(parsedBatchId) || parsedBatchId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Valid Batch selection is required.' });
  }

  if (!room_number || typeof room_number !== 'string' || !room_number.trim()) {
    return res.status(400).json({ error: 'Validation Error: Valid Room selection is required.' });
  }

  if (!slot_name || typeof slot_name !== 'string' || !VALID_THEORY_GROUPS.includes(slot_name.trim().toUpperCase())) {
    return res.status(400).json({ 
      error: `Validation Error: Invalid theory slot group "${slot_name}". Allowed groups are: ${VALID_THEORY_GROUPS.join(', ')}.` 
    });
  }

  if (faculty_id !== undefined && faculty_id !== null && faculty_id !== '') {
    const parsedFacultyId = Number(faculty_id);
    if (!Number.isInteger(parsedFacultyId) || parsedFacultyId <= 0) {
      return res.status(400).json({ error: 'Validation Error: Valid Faculty selection is required.' });
    }
  }

  next();
}

/**
 * Validates Staff User provisioning for POST requests
 */
export function validateUserProvision(req, res, next) {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Validation Error: Staff name must be between 2 and 100 characters.' });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Validation Error: A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Validation Error: Password must be at least 8 characters long.' });
  }

  if (!role || !['coordinator', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Validation Error: Role must be either "coordinator" or "viewer".' });
  }

  next();
}
