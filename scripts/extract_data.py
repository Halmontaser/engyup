"""
extract_data.py — Export SQLite curriculum data to JSON for Supabase migration.
"""
import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'components.db')
OUT_PATH = os.path.join(os.path.dirname(__file__), 'curriculum_dump.json')

def dict_factory(cursor, row):
    return {col[0]: row[i] for i, col in enumerate(cursor.description)}

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory

    grades = conn.execute('SELECT * FROM grades ORDER BY grade_number').fetchall()
    units = conn.execute('SELECT * FROM units ORDER BY grade_id, unit_number').fetchall()
    lessons = conn.execute('SELECT * FROM lessons ORDER BY unit_id, lesson_number').fetchall()
    activities = conn.execute('SELECT * FROM activities ORDER BY lesson_id, sort_order').fetchall()

    print(f"Grades:     {len(grades)}")
    print(f"Units:      {len(units)}")
    print(f"Lessons:    {len(lessons)}")
    print(f"Activities: {len(activities)}")

    dump = {
        "grades": grades,
        "units": units,
        "lessons": lessons,
        "activities": activities,
    }

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(dump, f, ensure_ascii=False)

    size_mb = os.path.getsize(OUT_PATH) / (1024 * 1024)
    print(f"\nExported to {OUT_PATH} ({size_mb:.1f} MB)")
    conn.close()

if __name__ == '__main__':
    main()
