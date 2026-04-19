import { NextRequest, NextResponse } from 'next/server';
import { getActivityById, updateActivity, deleteActivity } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const activity = getActivityById(id);

    if (!activity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activity not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      activity,
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
    const existing = getActivityById(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activity not found',
        },
        { status: 404 }
      );
    }

    const updatedActivity = updateActivity(id, body);

    if (!updatedActivity) {
      return NextResponse.json(
        {
          success: false,
          error: 'No changes made',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
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
    const existing = getActivityById(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Activity not found',
        },
        { status: 404 }
      );
    }

    const deleted = deleteActivity(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete activity',
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
