const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ccyqzcaghwaggtmkmigi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeXF6Y2FnaHdhZ2d0bWttaWdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY4NTAyOCwiZXhwIjoyMDgzMjYxMDI4fQ.ywwhWFvNKwCvK-IsZcHmXLYO3XCCnx50CDbEMPZfNbs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectClasses() {
    console.log('--- Listing ALL Classes ---');
    const { data: classes, error } = await supabase
        .from('classes')
        .select('id, name');

    if (error) console.error('Error:', error);
    else console.log('Classes:', JSON.stringify(classes, null, 2));
}

inspectClasses();
