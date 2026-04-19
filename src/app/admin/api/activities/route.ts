import { NextRequest, NextResponse } from 'next/server';
import { createActivity, getAllActivities } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const activities = getAllActivities();

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activities',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lesson_id, type, title, instruction, difficulty, data, sort_order } = body;

    // Validation
    if (!lesson_id || !type || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: lesson_id, type, and title are required',
        },
        { status: 400 }
      );
    }

    const newActivity = createActivity({
      lesson_id,
      type,
      title,
      instruction: instruction || '',
      difficulty,
      data: data || {},
      sort_order: sort_order || 0,
    });

    return NextResponse.json({
      success: true,
      activity: newActivity,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create activity',
      },
      { status: 500 }
    );
  }
}
