// Alternative staff counting methods for AdminInstitutions.tsx
// Use one of these based on where your staff data is stored

// ============================================
// OPTION 1: Count from profiles table only (CURRENT)
// ============================================
const { count: staffCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', inst.institution_id)
    .eq('role', 'faculty');


// ============================================
// OPTION 2: Count from staff_details table only
// ============================================
const { count: staffCount } = await supabase
    .from('staff_details')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', inst.institution_id);


// ============================================
// OPTION 3: Count from BOTH tables (RECOMMENDED if you have data in both)
// ============================================
const [profilesResult, staffDetailsResult] = await Promise.all([
    supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', inst.institution_id)
        .eq('role', 'faculty'),
    supabase
        .from('staff_details')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', inst.institution_id)
]);

// Use the maximum count from both tables
const staffCount = Math.max(
    profilesResult.count || 0,
    staffDetailsResult.count || 0
);


// ============================================
// OPTION 4: Count UNIQUE staff from both tables
// This is the most accurate if staff might be in both tables
// ============================================
const [profilesData, staffDetailsData] = await Promise.all([
    supabase
        .from('profiles')
        .select('id, email')
        .eq('institution_id', inst.institution_id)
        .eq('role', 'faculty'),
    supabase
        .from('staff_details')
        .select('profile_id, staff_id')
        .eq('institution_id', inst.institution_id)
]);

// Get unique staff IDs
const uniqueStaffIds = new Set([
    ...(profilesData.data || []).map(p => p.id),
    ...(staffDetailsData.data || []).map(s => s.profile_id).filter(Boolean)
]);

const staffCount = uniqueStaffIds.size;


// ============================================
// OPTION 5: Count with additional filters (status, etc.)
// ============================================
const { count: staffCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', inst.institution_id)
    .eq('role', 'faculty')
    .eq('status', 'active'); // Only count active staff


// ============================================
// RECOMMENDED: Use this in AdminInstitutions.tsx (lines 37-42)
// Replace the current staff counting code with this:
// ============================================

// Get staff count - check both profiles and staff_details tables
const [profilesStaffResult, staffDetailsResult] = await Promise.all([
    supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', inst.institution_id)
        .eq('role', 'faculty'),
    supabase
        .from('staff_details')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', inst.institution_id)
]);

// Use whichever table has more records (or sum them if they're different staff)
const staffCount = Math.max(
    profilesStaffResult.count || 0,
    staffDetailsResult.count || 0
);
