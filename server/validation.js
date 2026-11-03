// server/validation.js
// Server-side input validation middleware for CLUS

const VALID_ROOM_TYPES = ['Classroom', 'Lab', 'Lecture Hall'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SECTION_REGEX = /^[A-Z]$/i;

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
 * Validates Course input for POST requests
 */
export function validateCourse(req, res, next) {
  const { course_id, course_code, course_name, dept_id } = req.body;

  const parsedCourseId = Number(course_id);
  if (!Number.isInteger(parsedCourseId) || parsedCourseId <= 0) {
    return res.status(400).json({ error: 'Validation Error: Course ID must be a positive integer.' });
  }

  if (!course_code || typeof course_code !== 'string' || course_code.trim().length < 2 || course_code.trim().length > 20) {
    return res.status(400).json({ error: 'Validation Error: Course code must be between 2 and 20 characters.' });
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
 * Validates Schedule input for POST and PUT requests
 */
export function validateSchedule(req, res, next) {
  const { course_id, batch_id, room_number, slot_id } = req.body;

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

  const parsedSlotId = Number(slot_id);
  if (!Number.isInteger(parsedSlotId) || parsedSlotId <= 0 || parsedSlotId > 50) {
    return res.status(400).json({ error: 'Validation Error: Time slot ID must be a valid slot between 1 and 50.' });
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
