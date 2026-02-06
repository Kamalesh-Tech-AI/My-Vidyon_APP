-- Migration: Add assigned_class_teacher_id to leave_requests table
-- This simplifies the query logic and fixes the sync issue

-- Step 1: Add the column
ALTER TABLE leave_requests
ADD COLUMN IF NOT EXISTS assigned_class_teacher_id UUID REFERENCES profiles(id);

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher
ON leave_requests(assigned_class_teacher_id, status);

-- Step 3: Backfill existing leave requests with class teacher ID
-- This updates all existing leave requests to have the correct teacher mapping

UPDATE leave_requests lr
SET assigned_class_teacher_id = (
    SELECT fs.faculty_profile_id
    FROM students s
    JOIN classes c ON c.name = s.class_name
    JOIN faculty_subjects fs ON fs.class_id = c.id AND fs.section = s.section
    WHERE s.id = lr.student_id
      AND fs.assignment_type = 'class_teacher'
    LIMIT 1
)
WHERE lr.assigned_class_teacher_id IS NULL;

-- Step 4: Verify the update
SELECT 
    COUNT(*) as total_leaves,
    COUNT(assigned_class_teacher_id) as leaves_with_teacher,
    COUNT(*) - COUNT(assigned_class_teacher_id) as leaves_without_teacher
FROM leave_requests;

-- Expected result: leaves_without_teacher should be 0
