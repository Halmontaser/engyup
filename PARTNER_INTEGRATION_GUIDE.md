# Engyup Partner Integration Guide

> Embed Engyup's interactive English lessons in your app and track student progress.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [API Reference](#api-reference)
6. [Iframe Embed Protocol](#iframe-embed-protocol)
7. [Webhook Events](#webhook-events)
8. [Full Next.js Example](#full-nextjs-example)
9. [Standalone HTML Embed](#standalone-html-embed)
10. [Activity Types](#activity-types)
11. [Error Handling](#error-handling)
12. [Rate Limits & Security](#rate-limits--security)

---

## Overview

Engyup is an interactive English learning platform with **21 activity types** 
(MCQ, flashcard, gap-fill, match-pairs, and more). Partners can:

- **Embed the lesson player** via iframe in their app
- **Fetch lesson catalogs** via REST API
- **Track student progress** via API + webhook callbacks
- **Map partner users** to Engyup accounts for unified analytics

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Your App                           │
│                                                     │
│  Server-side:                 Client-side:          │
│  ┌──────────────┐             ┌──────────────────┐  │
│  │ Your API     │──API Key──► │ Embedded iframe  │  │
│  │              │  Engyup API │ (lesson player)  │  │
│  │ • Get lessons│             │                  │  │
│  │ • Map users  │             │ postMessage ◄──► │  │
│  │ • Read stats │             │ progress events  │  │
│  └──────────────┘             └──────────────────┘  │
│                                       │             │
│                                       ▼             │
│                              Engyup Webhook         │
│                              (progress callback)    │
└─────────────────────────────────────────────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │   Engyup API     │
            │                  │
            │ Base URL:        │
            │ https://engyup   │
            │ .vercel.app      │
            │                  │
            │ /api/partner/*   │
            └──────────────────┘
```

**Integration model**: Hybrid — REST API for server-to-server operations 
+ iframe for rendering the full lesson player with all 21 activity types.

## Prerequisites

| What | How to get it |
|---|---|
| **API Key** | Request from Engyup admin. You'll receive an `api_key` string |
| **Base URL** | `https://engyup.vercel.app` |
| **Allowed Origins** | Tell the Engyup admin your app's domain(s) for iframe CORS |

## Quick Start

### Step 1: Verify your API key

```bash
curl -X GET https://engyup.vercel.app/api/partner/lessons \
  -H "X-API-Key: YOUR_API_KEY"
```

Expected response:
```json
{
  "success": true,
  "lessons": [
    {
      "id": "uuid",
      "title": "Present Simple Tense",
      "module_id": "uuid",
      "order_index": 1,
      "description": "...",
      "objectives": "..."
    }
  ]
}
```

### Step 2: Generate an embed token

```bash
curl -X POST https://engyup.vercel.app/api/partner/embed-token \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "LESSON_ID_FROM_STEP_1",
    "externalUserId": "your-user-123",
    "displayName": "Ahmed"
  }'
```

Response:
```json
{
  "success": true,
  "embedToken": "eyJwYXJ0bmVySWQ...",
  "embedUrl": "/embed?token=eyJwYXJ0bmVySWQ..."
}
```

### Step 3: Embed the lesson player

```html
<iframe
  src="https://engyup.vercel.app/embed?token=EMBED_TOKEN"
  style="width: 100%; height: 600px; border: none; border-radius: 12px;"
  allow="autoplay; microphone"
></iframe>
```

### Step 4: Listen for progress events

```javascript
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://engyup.vercel.app') return;

  const { type, payload } = event.data;

  switch (type) {
    case 'ENGYUP_READY':
      console.log('Lesson player loaded');
      break;
    case 'ENGYUP_ACTIVITY_COMPLETE':
      console.log('Activity done:', payload.activityId);
      // Save progress to your backend
      break;
    case 'ENGYUP_COMPLETED':
      console.log('Lesson finished:', payload.lessonId);
      // Mark lesson as complete in your app
      break;
    case 'ENGYUP_EXIT':
      console.log('User exited');
      // Navigate away or close the embed
      break;
  }
});
```

---

## API Reference

**Base URL**: `https://engyup.vercel.app`  
**Authentication**: All requests require `X-API-Key` header.

---

### 1. List Lessons

```
GET /api/partner/lessons
```

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `courseId` | UUID | No | Filter lessons by course |

**Response:**
```json
{
  "success": true,
  "lessons": [
    {
      "id": "uuid",
      "title": "string",
      "module_id": "uuid",
      "order_index": 0,
      "description": "string | null",
      "objectives": "string | null"
    }
  ]
}
```

> **Note**: If your partner account has course restrictions (`allowed_courses`), 
> only lessons from those courses are returned.

---

### 2. Get Lesson Activities

```
GET /api/partner/lessons/:lessonId/activities
```

**Path Parameters:**

| Param | Type | Description |
|---|---|---|
| `lessonId` | UUID | The lesson ID |

**Response:**
```json
{
  "success": true,
  "activities": [
    {
      "activity_id": "uuid",
      "lesson_id": "uuid",
      "activity_type": "mcq",
      "title": "string",
      "instruction": "string",
      "content": { /* activity-specific JSON */ },
      "order_index": 0,
      "difficulty": "easy | medium | hard",
      "xp_reward": 10,
      "is_required": true
    }
  ]
}
```

---

### 3. Generate Embed Token

```
POST /api/partner/embed-token
```

**Request Body:**
```json
{
  "lessonId": "uuid",          // Required — which lesson to embed
  "externalUserId": "string",  // Required — your user's ID in your system
  "displayName": "string"      // Optional — user display name
}
```

**Response:**
```json
{
  "success": true,
  "embedToken": "base64url-encoded-string",
  "embedUrl": "/embed?token=..."
}
```

> **Token Expiry**: Tokens expire after **1 hour**. Generate a fresh token 
> for each session.

> **User Mapping**: The first time you use an `externalUserId`, Engyup 
> automatically creates a mapping record. Subsequent calls reuse the 
> existing mapping.

---

### 4. Submit Progress

```
POST /api/partner/progress
```

**Request Body:**
```json
{
  "externalUserId": "string",   // Required — your user's ID
  "activityId": "uuid",         // Required — the activity completed
  "status": "completed",        // "completed" | "in_progress"
  "score": 85,                  // Optional — score out of 100
  "timeSpentSeconds": 120       // Optional — time spent
}
```

**Response:**
```json
{ "success": true }
```

> This endpoint records progress in Engyup's `activity_progress` table and 
> creates an xAPI statement for analytics. If a webhook URL is configured, 
> Engyup will also POST a callback to your server.

---

### 5. Query User Progress

```
GET /api/partner/users/:externalUserId/progress
```

**Path Parameters:**

| Param | Type | Description |
|---|---|---|
| `externalUserId` | string | Your user's ID in your system |

**Response:**
```json
{
  "success": true,
  "progress": [
    {
      "activity_id": "uuid",
      "status": "completed",
      "score": 85,
      "time_spent_seconds": 120,
      "completed_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Iframe Embed Protocol

The Engyup lesson player communicates with the parent page via `postMessage`.

### Message Types (Engyup → Your App)

| Type | Payload | When |
|---|---|---|
| `ENGYUP_READY` | `{}` | Player loaded, ready for interaction |
| `ENGYUP_ACTIVITY_COMPLETE` | `{ activityId, externalUserId, timestamp }` | Student completed one activity |
| `ENGYUP_COMPLETED` | `{ lessonId }` | Student finished all activities in the lesson |
| `ENGYUP_EXIT` | `{}` | Student clicked the back/exit button |

### TypeScript Interfaces

```typescript
// Message from Engyup iframe
interface EngyupMessage {
  type: 'ENGYUP_READY' | 'ENGYUP_ACTIVITY_COMPLETE' | 'ENGYUP_COMPLETED' | 'ENGYUP_EXIT';
  payload?: {
    activityId?: string;
    lessonId?: string;
    externalUserId?: string;
    timestamp?: string;
  };
}

// Handler setup
function handleEngyupMessage(event: MessageEvent<EngyupMessage>) {
  if (event.origin !== 'https://engyup.vercel.app') return;
  const { type, payload } = event.data;
  // Handle each type...
}

window.addEventListener('message', handleEngyupMessage);
```

### Security: Always Validate Origin

```typescript
// ✅ Correct — only trust messages from Engyup
if (event.origin !== 'https://engyup.vercel.app') return;

// ❌ Wrong — never trust all origins
// (no origin check)
```

---

## Webhook Events

If your partner account has a `webhook_url` configured, Engyup will POST 
events to your server when progress is recorded.

### Webhook Payload

```json
{
  "event": "activity_completed",
  "external_user_id": "your-user-123",
  "data": {
    "activityId": "uuid",
    "score": 85,
    "timeSpentSeconds": 120
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Event Types

| Event | Description |
|---|---|
| `activity_completed` | A single activity was completed |
| `lesson_completed` | All activities in a lesson were completed |
| `quiz_scored` | A quiz/assessment was scored |

### Verifying Webhooks

Every webhook request includes an `X-Webhook-Secret` header containing your 
partner's `api_secret`. Verify this matches to confirm the request came from 
Engyup:

```typescript
app.post('/webhook/engyup', (req, res) => {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.ENGYUP_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }

  const { event, external_user_id, data } = req.body;
  // Process the event...

  res.json({ received: true });
});
```

---

## Full Next.js Example

### API Route: `/app/api/engyup/embed/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const ENGYUP_API_KEY = process.env.ENGYUP_API_KEY!;
const ENGYUP_BASE_URL = 'https://engyup.vercel.app';

// Generate an embed token for a lesson
export async function POST(req: NextRequest) {
  const { lessonId, userId, displayName } = await req.json();

  const response = await fetch(`${ENGYUP_BASE_URL}/api/partner/embed-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ENGYUP_API_KEY,
    },
    body: JSON.stringify({
      lessonId,
      externalUserId: userId,
      displayName,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }

  return NextResponse.json({
    embedUrl: `${ENGYUP_BASE_URL}${data.embedUrl}`,
  });
}
```

### API Route: `/app/api/engyup/lessons/route.ts`

```typescript
import { NextResponse } from 'next/server';

const ENGYUP_API_KEY = process.env.ENGYUP_API_KEY!;
const ENGYUP_BASE_URL = 'https://engyup.vercel.app';

export async function GET() {
  const response = await fetch(`${ENGYUP_BASE_URL}/api/partner/lessons`, {
    headers: { 'X-API-Key': ENGYUP_API_KEY },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

### React Component: `EngyupLesson.tsx`

```tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface EngyupLessonProps {
  lessonId: string;
  userId: string;
  displayName: string;
  onComplete?: (lessonId: string) => void;
  onActivityComplete?: (activityId: string) => void;
  onExit?: () => void;
}

export default function EngyupLesson({
  lessonId,
  userId,
  displayName,
  onComplete,
  onActivityComplete,
  onExit,
}: EngyupLessonProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate embed token on mount
  useEffect(() => {
    async function getEmbedUrl() {
      try {
        const res = await fetch('/api/engyup/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, userId, displayName }),
        });
        const data = await res.json();
        if (data.embedUrl) {
          setEmbedUrl(data.embedUrl);
        } else {
          setError('Failed to load lesson');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    getEmbedUrl();
  }, [lessonId, userId, displayName]);

  // Listen for postMessage events from Engyup
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== 'https://engyup.vercel.app') return;

      const { type, payload } = event.data;

      switch (type) {
        case 'ENGYUP_READY':
          console.log('Engyup lesson player ready');
          break;
        case 'ENGYUP_ACTIVITY_COMPLETE':
          onActivityComplete?.(payload.activityId);
          break;
        case 'ENGYUP_COMPLETED':
          onComplete?.(payload.lessonId);
          break;
        case 'ENGYUP_EXIT':
          onExit?.();
          break;
      }
    },
    [onComplete, onActivityComplete, onExit]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-slate-100 rounded-xl">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !embedUrl) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-red-50 rounded-xl">
        <p className="text-red-600">{error || 'Something went wrong'}</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      className="w-full h-[600px] border-0 rounded-xl shadow-lg"
      allow="autoplay; microphone"
      title="Engyup Lesson Player"
    />
  );
}
```

### Usage in a Page

```tsx
import EngyupLesson from '@/components/EngyupLesson';

export default function LearningPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Today's Lesson</h1>
      <EngyupLesson
        lessonId="uuid-of-the-lesson"
        userId="student-456"
        displayName="Ahmed"
        onComplete={(lessonId) => {
          console.log('Lesson complete!', lessonId);
          // Update your database, show a success message, etc.
        }}
        onActivityComplete={(activityId) => {
          console.log('Activity done:', activityId);
          // Optionally sync to your backend
        }}
        onExit={() => {
          // Navigate back to lesson list
          window.history.back();
        }}
      />
    </div>
  );
}
```

### Webhook Handler: `/app/api/webhook/engyup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== process.env.ENGYUP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { event, external_user_id, data, timestamp } = body;

  switch (event) {
    case 'activity_completed':
      // Update your database with progress
      console.log(`User ${external_user_id} completed activity ${data.activityId}`);
      break;
    case 'lesson_completed':
      // Mark lesson as complete
      console.log(`User ${external_user_id} finished lesson`);
      break;
    case 'quiz_scored':
      // Record quiz score
      console.log(`User ${external_user_id} scored ${data.score}`);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Standalone HTML Embed

If you need a quick embed without a framework:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Engyup Lesson</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f1f5f9; padding: 2rem; }
    .lesson-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }
    .lesson-header { padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .lesson-header h2 { font-size: 1.25rem; color: #1e293b; }
    iframe { width: 100%; height: 600px; border: none; display: block; }
    .status { padding: 1rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="lesson-container">
    <div class="lesson-header">
      <h2>📚 English Lesson</h2>
    </div>
    <iframe
      id="engyup-player"
      src="https://engyup.vercel.app/embed?token=YOUR_EMBED_TOKEN"
      allow="autoplay; microphone"
    ></iframe>
    <div class="status" id="status">Loading lesson...</div>
  </div>

  <script>
    const status = document.getElementById('status');

    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://engyup.vercel.app') return;

      const { type, payload } = event.data;

      switch (type) {
        case 'ENGYUP_READY':
          status.textContent = '✅ Lesson loaded — start learning!';
          break;
        case 'ENGYUP_ACTIVITY_COMPLETE':
          status.textContent = `✅ Activity completed: ${payload.activityId}`;
          break;
        case 'ENGYUP_COMPLETED':
          status.textContent = '🎉 Lesson complete! Well done!';
          status.style.background = '#ecfdf5';
          status.style.color = '#065f46';
          break;
        case 'ENGYUP_EXIT':
          status.textContent = 'Exited lesson player';
          break;
      }
    });
  </script>
</body>
</html>
```

---

## Activity Types

Engyup supports **21 interactive activity types**, all rendered automatically 
by the embedded lesson player:

| Type | Description |
|---|---|
| `mcq` | Multiple choice questions |
| `flashcard` | Vocabulary flashcards |
| `gap-fill` | Fill in the blank |
| `true-false` | True/False questions |
| `match-pairs` | Match items together |
| `word-order` | Arrange words in correct order |
| `reading-passage` | Reading comprehension |
| `category-sort` | Sort items into categories |
| `dialogue-read` | Interactive dialogue reading |
| `transform-sentence` | Sentence transformation |
| `image-label` | Label parts of an image |
| `guessing-game` | Word guessing game |
| `reading-sequence` | Sequential reading |
| `sentence-builder` | Build sentences from parts |
| `word-association` | Word association exercise |
| `pronunciation-practice` | Pronunciation with audio |
| `listening-comprehension` | Listening exercises |
| `spelling-bee` | Spelling challenges |
| `dictation` | Audio dictation |
| `conversation-sim` | Conversation simulation |
| `picture-description` | Describe images in English |

> You don't need to handle these individually — the iframe renders all of 
> them automatically.

---

## Error Handling

### HTTP Error Codes

| Code | Meaning | What to do |
|---|---|---|
| `401` | Invalid or missing API key | Check your `X-API-Key` header |
| `429` | Rate limit exceeded | Wait and retry (default: 1000 req/hr) |
| `500` | Server error | Retry after a brief delay |

### Embed Token Errors

If the token is expired or invalid, the iframe will show a loading spinner 
indefinitely. Always generate **fresh tokens** for each session:

```typescript
// ✅ Good — generate token per session
const token = await generateEmbedToken(lessonId, userId);

// ❌ Bad — reusing old tokens
const token = localStorage.getItem('cached_token'); // May be expired!
```

---

## Rate Limits & Security

| Setting | Default | Notes |
|---|---|---|
| **Rate limit** | 1,000 requests/hour | Per API key |
| **Token expiry** | 1 hour | Generate fresh tokens per session |
| **Allowed origins** | Configured per partner | iframe CORS protection |
| **Webhook secret** | Unique per partner | Verify `X-Webhook-Secret` header |

### Environment Variables (Your App)

```env
# .env.local
ENGYUP_API_KEY=your-api-key-from-admin
ENGYUP_WEBHOOK_SECRET=your-webhook-secret-from-admin
```

> **Never expose your API key in client-side code.** Always call the Engyup 
> API from your server, then pass the embed token/URL to the client.

---

## Support

Contact the Engyup team for:
- API key provisioning
- Webhook URL configuration
- Course access permissions
- Custom rate limits
- Technical support
