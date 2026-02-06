const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function investigateClassIssue() {
    console.log('🔍 Investigating Class Mapping Issue\n');

    try {
        // Check what classes exist in the classes table
        console.log('1️⃣ Checking classes table...');
        const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('id, name')
            .order('name');

        if (classError) {
            console.error('Error fetching classes:', classError);
        } else {
            console.log(`\n✅ Found ${classes?.length || 0} classes:`);
            classes?.forEach(c => console.log(`   - ${c.name} (ID: ${c.id})`));
        }

        // Check what student classes exist
        console.log('\n2️⃣ Checking student class names...');
        const { data: studentClasses, error: studentError } = await supabase
            .from('students')
            .select('class_name')
            .order('class_name');

        if (studentError) {
            console.error('Error fetching student classes:', studentError);
        } else {
            const uniqueClasses = [...new Set(studentClasses?.map(s => s.class_name))];
            console.log(`\n✅ Students are in these classes:`);
            uniqueClasses.forEach(c => console.log(`   - "${c}"`));
        }

        // Check if there's a mismatch
        console.log('\n3️⃣ Looking for specific student with class "9th"...');
        const { data: ninthGradeStudents, error: ninthError } = await supabase
            .from('students')
            .select('id, name, class_name, section')
            .eq('class_name', '9th')
            .limit(5);

        if (ninthError) {
            console.error('Error:', ninthError);
        } else {
            console.log(`\n✅ Found ${ninthGradeStudents?.length || 0} students in "9th" grade:`);
            ninthGradeStudents?.forEach(s => {
                console.log(`   - ${s.name} (${s.class_name}-${s.section})`);
            });
        }

        // Check faculty assignments
        console.log('\n4️⃣ Checking faculty class assignments...');
        const { data: assignments, error: assignError } = await supabase
            .from('faculty_subjects')
            .select(`
        id,
        section,
        assignment_type,
        classes:class_id (id, name)
      `)
            .eq('assignment_type', 'class_teacher');

        if (assignError) {
            console.error('Error:', assignError);
        } else {
            console.log(`\n✅ Found ${assignments?.length || 0} class teacher assignments:`);
            assignments?.forEach(a => {
                console.log(`   - ${(a.classes as any)?.name || 'Unknown'} Section ${a.section}`);
            });
        }

        console.log('\n📋 DIAGNOSIS:');
        console.log('─────────────────────────────────────────');

        const classesExist = classes && classes.length > 0;
        const studentsHave9th = ninthGradeStudents && ninthGradeStudents.length > 0;
        const classesTable = classes?.map(c => c.name) || [];

        if (studentsHave9th && !classesTable.includes('9th')) {
            console.log('❌ MISMATCH FOUND:');
            console.log('   - Students table has class_name = "9th"');
            console.log('   - Classes table does NOT have a class named "9th"');
            console.log('\n💡 SOLUTION: Either:');
            console.log('   A) Add "9th" to classes table');
            console.log('   B) Update student records to match existing class names');
        } else if (!studentsHave9th) {
            console.log('⚠️  No students found with class "9th"');
            console.log('   Check the actual student data in the app');
        } else {
            console.log('✅ No obvious mismatch found');
            console.log('   Further investigation needed');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

investigateClassIssue();
