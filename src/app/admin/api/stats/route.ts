import { NextResponse } from 'next/server';
import { getAllActivities, getGrades, getUnitsForGrade } from '@/lib/db';

export async function GET() {
  try {
    const activities = getAllActivities();

    // Get unique lesson IDs
    const lessonIds = new Set(activities.map((a) => a.lesson_id));

    // Get all grades and units
    const grades = getGrades();
    const units: any[] = [];
    
    grades.forEach((grade) => {
      try {
        const gradeUnits = getUnitsForGrade(grade.grade_number);
        gradeUnits.forEach((unit) => units.push(unit));
      } catch (e) {
        console.error(`Error fetching units for grade ${grade.grade_number}:`, e);
      }
    });

    // Count activities by type
    const activitiesByType: Record<string, number> = {};
    activities.forEach((a) => {
      const type = a.type;
      activitiesByType[type] = (activitiesByType[type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalActivities: activities.length,
        totalLessons: lessonIds.size,
        totalUnits: units.length,
        totalGrades: grades.length,
        activitiesByType,
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
      },
      { status: 500 }
    );
  }
}
