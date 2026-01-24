import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const email = 'kamalesh@myvidyon.edu';
    console.log(`Inspecting data for ${email}...`);

    // 1. Fetch Student
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .ilike('email', email)
        .single();

    if (studentError) {
        console.error('Student not found:', studentError.message);
        return;
    }
    console.log('Student Data:', JSON.stringify(student, null, 2));

    // 2. Fetch Class
    if (student.class_name) {
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('*, groups(name)')
            .eq('name', student.class_name)
            .maybeSingle();

        if (classError) {
            console.error('Class fetch error:', classError.message);
        } else {
            console.log('Class Data:', JSON.stringify(classData, null, 2));
        }
    }

    // 3. Fetch Class Teacher / Advisor
    // Assuming staff_details links to class_assigned (text) or class_id?
    const { data: staff, error: staffError } = await supabase
        .from('staff_details')
        .select('*, profiles(full_name)')
        .eq('class_assigned', student.class_name)
        .maybeSingle();

    if (staffError) {
        console.error('Staff fetch error:', staffError.message);
    } else {
        console.log('Staff Data:', JSON.stringify(staff, null, 2));
    }

    // 4. Fetch Subjects
    // Try faculty_subjects as well
    const { data: facultySubjects, error: fsError } = await supabase
        .from('faculty_subjects')
        .select('*, subjects(*), profiles!faculty_profile_id(full_name)')
        .eq('section', student.section);

    if (fsError) {
        console.error('Faculty subjects error:', fsError.message);
    } else {
        console.log('Faculty Subjects Count:', facultySubjects?.length);
        if (facultySubjects?.length) {
            console.log('Sample Subject:', JSON.stringify(facultySubjects[0], null, 2));
        }
    }
}

inspect();
