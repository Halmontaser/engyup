import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to fetch activities',
        },
        { status: 500 }
      );
    }

    // Transform activities to match the expected format
    const transformedActivities = (activities || []).map(activity => ({
      id: activity.activity_id,
      lesson_id: activity.lesson_id,
      type: activity.activity_type,
      title: activity.title || '',
      instruction: activity.instruction || '',
      difficulty: activity.difficulty || null,
      book_type: activity.book_type || null,
      book_page: activity.book_page || null,
      compensates: activity.compensates || null,
      data: activity.content,
      sort_order: activity.order_index || 0,
      is_required: activity.is_required ?? true,
      xp_reward: activity.xp_reward ?? 10,
      time_estimate_minutes: activity.time_estimate_minutes ?? null,
      created_at: activity.created_at,
    }));

    return NextResponse.json({
      success: true,
      activities: transformedActivities,
      count: transformedActivities.length,
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
    const { lesson_id, type, title, instruction, difficulty, data, sort_order, is_required, xp_reward, time_estimate_minutes, book_type, book_page, compensates } = body;

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

    // Transform field names for Supabase
    const newActivityData = {
      lesson_id,
      activity_type: type,
      title,
      instruction: instruction || '',
      difficulty,
      book_type: book_type || null,
      book_page: book_page || null,
      compensates: compensates || null,
      content: data || {},
      order_index: sort_order || 0,
      is_required: is_required ?? true,
      xp_reward: xp_reward ?? 10,
      time_estimate_minutes: time_estimate_minutes ?? null,
    };

    const { data: createdActivity, error } = await supabase
      .from('activities')
      .insert(newActivityData)
      .select('*')
      .single();

    if (error || !createdActivity) {
      console.error('Error creating activity:', error);
      return NextResponse.json(
        {
          success: false,
          error: error?.message || 'Failed to create activity',
        },
        { status: 500 }
      );
    }

    // Transform response to match expected format
    const transformedActivity = {
      id: createdActivity.activity_id,
      lesson_id: createdActivity.lesson_id,
      type: createdActivity.activity_type,
      title: createdActivity.title || '',
      instruction: createdActivity.instruction || '',
      difficulty: createdActivity.difficulty || null,
      book_type: createdActivity.book_type || null,
      book_page: createdActivity.book_page || null,
      compensates: createdActivity.compensates || null,
      data: createdActivity.content,
      sort_order: createdActivity.order_index || 0,
      is_required: createdActivity.is_required ?? true,
      xp_reward: createdActivity.xp_reward ?? 10,
      time_estimate_minutes: createdActivity.time_estimate_minutes ?? null,
      created_at: createdActivity.created_at,
    };

    return NextResponse.json({
      success: true,
      activity: transformedActivity,
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