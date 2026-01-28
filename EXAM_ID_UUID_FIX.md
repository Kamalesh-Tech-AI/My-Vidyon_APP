# Fixed: Invalid UUID Error for exam_id

## The Problem

**Error:**
```
"invalid input syntax for type uuid: \"mid-term-1\""
```

**Root Cause:**
The code was passing `"mid-term-1"` (an exam_type string) directly to the `exam_id` field, but the database expects a UUID.

## The Solution ✅ IMPLEMENTED

Created a helper function `getExamId()` that:
1. Checks if the value is already a UUID (returns it)
2. Otherwise, looks up the exam UUID by `exam_type` from the `exams` table

```typescript
const getExamId = async (examIdentifier: string) => {
    // If it's already a UUID format, return it
    if (examIdentifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return examIdentifier;
    }
    
    // Otherwise, look it up by exam_type
    const { data, error } = await supabase
        .from('exams')
        .select('id')
        .eq('exam_type', examIdentifier)
        .eq('institution_id', user?.institutionId)
        .limit(1)
        .single();
    
    if (error) {
        console.error('Error fetching exam ID:', error);
        throw new Error(`Exam not found for type: ${examIdentifier}`);
    }
    
    return data?.id;
};
```

## Status: ✅ RESOLVED

The issue has been fixed. All database operations now use proper UUIDs instead of exam_type strings.

## How It Works

```
User selects: "mid-term-1" (exam_type)
        ↓
getExamId() looks up in exams table
        ↓
Returns: "a1b2c3d4-..." (actual UUID)
        ↓
Uses UUID in all database operations
        ✅ Success!
```

