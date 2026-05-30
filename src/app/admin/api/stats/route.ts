import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get all activities from Supabase
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('lesson_id, activity_type');

    if (activitiesError) throw activitiesError;

    // Get unique lesson IDs
    const lessonIds = new Set(activities?.map((a) => a.lesson_id) || []);

    // Get lessons from Supabase to get unit IDs
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('unit_id');

    if (lessonsError) throw lessonsError;

    // Get unique unit IDs
    const unitIds = new Set(lessons?.map((l) => l.unit_id) || []);

    // Count activities by type
    const activitiesByType: Record<string, number> = {};
    (activities || []).forEach((a) => {
      const type = a.activity_type;
      activitiesByType[type] = (activitiesByType[type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalActivities: activities?.length || 0,
        totalLessons: lessonIds.size,
        totalUnits: unitIds.size,
        totalGrades: 0, // Can fetch from grades table if needed
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