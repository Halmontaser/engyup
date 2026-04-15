import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), "components.db");
    db = new Database(dbPath);
  }
  return db;
}

/* ─── Grade ─── */
export interface Grade {
  id: number;
  grade_number: number;
  label: string;
}

export function getGrades(): Grade[] {
  return getDb()
    .prepare("SELECT id, grade_number, label FROM grades ORDER BY grade_number")
    .all() as Grade[];
}

/* ─── Unit ─── */
export interface Unit {
  id: number;
  grade_id: number;
  unit_number: number;
  title: string;
  total_lessons: number;
  lesson_count: number;
}

export function getUnitsForGrade(gradeNumber: number): Unit[] {
  return getDb()
    .prepare(
      `SELECT u.*, 
              (SELECT COUNT(*) FROM lessons l WHERE l.unit_id = u.id) AS lesson_count
       FROM units u 
       JOIN grades g ON u.grade_id = g.id 
       WHERE g.grade_number = ? 
       ORDER BY u.unit_number`
    )
    .all(gradeNumber) as Unit[];
}

export function getGradeByNumber(gradeNumber: number): Grade | undefined {
  return getDb()
    .prepare("SELECT id, grade_number, label FROM grades WHERE grade_number = ?")
    .get(gradeNumber) as Grade | undefined;
}

/* ─── Lesson ─── */
export interface Lesson {
  id: string;
  unit_id: number;
  lesson_number: number;
  title: string;
  description: string;
  objectives: string | null;
  language_focus: string | null;
  vocabulary: string | null;
  cover_image_src: string | null;
  passing_score: number;
}

export function getLessonsForUnit(gradeNumber: number, unitNumber: number): Lesson[] {
  return getDb()
    .prepare(
      `SELECT l.* FROM lessons l
       JOIN units u ON l.unit_id = u.id
       JOIN grades g ON u.grade_id = g.id
       WHERE g.grade_number = ? AND u.unit_number = ?
       ORDER BY l.lesson_number`
    )
    .all(gradeNumber, unitNumber) as Lesson[];
}

export function getUnitByNumbers(gradeNumber: number, unitNumber: number): Unit | undefined {
  return getDb()
    .prepare(
      `SELECT u.* FROM units u
       JOIN grades g ON u.grade_id = g.id
       WHERE g.grade_number = ? AND u.unit_number = ?`
    )
    .get(gradeNumber, unitNumber) as Unit | undefined;
}

/* ─── Activity ─── */
export interface Activity {
  id: string;
  lesson_id: string;
  type: string;
  title: string;
  instruction: string;
  difficulty: string | null;
  book_type: string | null;
  book_page: string | null;
  data: string; // JSON string
  sort_order: number;
  compensates?: string | null;
}

export function getLesson(lessonId: string): Lesson | undefined {
  return getDb()
    .prepare("SELECT * FROM lessons WHERE id = ?")
    .get(lessonId) as Lesson | undefined;
}

export function getActivitiesForLesson(lessonId: string): Activity[] {
  return getDb()
    .prepare(
      `SELECT id, lesson_id, type, title, instruction, difficulty, book_type, book_page, data, sort_order
       FROM activities 
       WHERE lesson_id = ? 
       ORDER BY sort_order`
    )
    .all(lessonId) as Activity[];
}

/* ─── Stats ─── */
export function getActivityCountForLesson(lessonId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as count FROM activities WHERE lesson_id = ?")
    .get(lessonId) as { count: number };
  return row.count;
}

/* ─── Activity CRUD ─── */
export interface CreateActivityInput {
  lesson_id: string;
  type: string;
  title: string;
  instruction: string;
  difficulty?: string;
  book_type?: string;
  book_page?: string;
  data: any;
  sort_order?: number;
}

export function createActivity(input: CreateActivityInput): Activity {
  const stmt = getDb().prepare(`
    INSERT INTO activities (lesson_id, type, title, instruction, difficulty, book_type, book_page, data, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const result = stmt.run(
    input.lesson_id,
    input.type,
    input.title,
    input.instruction,
    input.difficulty || null,
    input.book_type || null,
    input.book_page || null,
    JSON.stringify(input.data),
    input.sort_order || 0
  );
  return getActivityById(String(result.lastInsertRowid))!;
}

export function updateActivity(id: string, input: Partial<CreateActivityInput>): Activity | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (input.title !== undefined) { fields.push("title = ?"); values.push(input.title); }
  if (input.instruction !== undefined) { fields.push("instruction = ?"); values.push(input.instruction); }
  if (input.difficulty !== undefined) { fields.push("difficulty = ?"); values.push(input.difficulty); }
  if (input.data !== undefined) { fields.push("data = ?"); values.push(JSON.stringify(input.data)); }
  if (input.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(input.sort_order); }

  if (fields.length === 0) return null;

  values.push(id);
  const stmt = getDb().prepare(`UPDATE activities SET ${fields.join(", ")} WHERE id = ?`);
  stmt.run(...values);
  return getActivityById(id);
}

export function deleteActivity(id: string): boolean {
  const result = getDb().prepare("DELETE FROM activities WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getActivityById(id: string): Activity | undefined {
  return getDb().prepare("SELECT * FROM activities WHERE id = ?").get(id) as Activity | undefined;
}

export function getAllActivities(): Activity[] {
  return getDb()
    .prepare(`
      SELECT a.* FROM activities a
      ORDER BY a.created_at DESC
    `)
    .all() as Activity[];
}

export function getActivitiesByLesson(lessonId: string): Activity[] {
  return getDb()
    .prepare(`
      SELECT * FROM activities
      WHERE lesson_id = ?
      ORDER BY sort_order ASC
    `)
    .all(lessonId) as Activity[];
}
