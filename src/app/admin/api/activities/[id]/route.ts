import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: activity, error } = await supabase
      .from('activities')
      .select('*')
      .eq('activity_id', id)
      .single();

    if (error || !activity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activity not found',
        },
        { status: 404 }
      );
    }

    // Transform activity to match the expected format
    const transformedActivity = {
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
      is_required: activity.is_required,
      xp_reward: activity.xp_reward,
      time_estimate_minutes: activity.time_estimate_minutes,
    };

    return NextResponse.json({
      success: true,
      activity: transformedActivity,
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activity',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if activity exists
    const { data: existing, error: checkError } = await supabase
      .from('activities')
      .select('activity_id')
      .eq('activity_id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activity not found',
        },
        { status: 404 }
      );
    }

    // Build update object - transform field names to match Supabase schema
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.instruction !== undefined) updateData.instruction = body.instruction;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.book_type !== undefined) updateData.book_type = body.book_type;
    if (body.book_page !== undefined) updateData.book_page = body.book_page;
    if (body.compensates !== undefined) updateData.compensates = body.compensates;
    if (body.data !== undefined) updateData.content = body.data;
    if (body.sort_order !== undefined) updateData.order_index = body.sort_order;

    // Update activity
    const { data: updatedActivity, error: updateError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('activity_id', id)
      .select('*')
      .single();

    if (updateError || !updatedActivity) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: updateError?.message || 'Failed to update activity',
        },
        { status: 500 }
      );
    }

    // Transform activity to match the expected format
    const transformedActivity = {
      id: updatedActivity.activity_id,
      lesson_id: updatedActivity.lesson_id,
      type: updatedActivity.activity_type,
      title: updatedActivity.title || '',
      instruction: updatedActivity.instruction || '',
      difficulty: updatedActivity.difficulty || null,
      book_type: updatedActivity.book_type || null,
      book_page: updatedActivity.book_page || null,
      compensates: updatedActivity.compensates || null,
      data: updatedActivity.content,
      sort_order: updatedActivity.order_index || 0,
      is_required: updatedActivity.is_required,
      xp_reward: updatedActivity.xp_reward,
      time_estimate_minutes: updatedActivity.time_estimate_minutes,
    };

    return NextResponse.json({
      success: true,
      activity: transformedActivity,
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update activity',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if activity exists
    const { data: existing, error: checkError } = await supabase
      .from('activities')
      .select('activity_id')
      .eq('activity_id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activity not found',
        },
        { status: 404 }
      );
    }

    // Delete activity
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('activity_id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: deleteError.message || 'Failed to delete activity',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete activity',
      },
      { status: 500 }
    );
  }
}