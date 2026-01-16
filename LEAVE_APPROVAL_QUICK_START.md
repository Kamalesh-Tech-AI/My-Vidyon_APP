# Leave Approval System - Quick Start Guide

## 🎯 What's Been Implemented

A complete leave management system where:
- **Faculty** can submit leave requests through their panel
- **Institution** admins can approve/reject requests through the institution portal
- **Real-time** updates ensure both parties see changes instantly

---

## 📋 How It Works

### For Faculty Members

#### Step 1: Submit a Leave Request
1. Navigate to **"Leave Requests"** in the faculty panel
2. Click **"Apply for Leave"** button
3. Fill in the form:
   - **Leave Type**: Choose from Sick Leave, Casual Leave, Medical Leave, or Unpaid Leave
   - **From Date**: Select start date
   - **To Date**: Select end date
   - **Reason**: Explain why you need leave
4. Click **"Submit Request"**

#### Step 2: Track Your Request
- View all your leave requests in the **"Leave History"** table
- See the status with color-coded badges:
  - 🟡 **Yellow** = Pending (waiting for approval)
  - 🟢 **Green** = Approved
  - 🔴 **Red** = Rejected
- Dashboard shows:
  - Total leave balance
  - Number of approved leaves
  - Number of pending requests

#### Step 3: Get Real-time Updates
- When institution approves/rejects your request, the status updates **automatically**
- No need to refresh the page!

---

### For Institution Admins

#### Step 1: View Leave Requests
1. Navigate to **"Leave Approval"** in the institution portal
2. See a table of all leave requests from faculty
3. Requests show:
   - Staff name
   - Role
   - Leave dates
   - Leave type
   - Current status

#### Step 2: Review Request Details
1. Click **"View Details"** on any request
2. Review the complete information:
   - Staff profile
   - Leave type
   - Duration (start and end dates)
   - Detailed reason/description

#### Step 3: Approve or Reject
1. For pending requests, you'll see two buttons:
   - **✓ Approve** (green button)
   - **✗ Deny** (red button)
2. Click your choice
3. The status updates in the database
4. Faculty member sees the update **instantly**

---

## 🗄️ Database Structure

The system uses the `staff_leaves` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `institution_id` | TEXT | Which institution this belongs to |
| `staff_id` | UUID | Which faculty member submitted it |
| `leave_type` | TEXT | Type of leave (Sick, Casual, etc.) |
| `start_date` | DATE | When leave starts |
| `end_date` | DATE | When leave ends |
| `reason` | TEXT | Why they need leave |
| `status` | TEXT | pending/approved/rejected |
| `approved_by` | UUID | Who approved/rejected it |
| `created_at` | TIMESTAMP | When request was submitted |

---

## 🔄 Real-time Synchronization

Both panels use **Supabase real-time subscriptions**:

### Faculty Panel
- Listens for changes to their own leave requests
- Updates automatically when status changes

### Institution Portal
- Listens for all leave requests in the institution
- Updates automatically when new requests arrive

---

## 🎨 UI Features

### Faculty Panel
```
┌─────────────────────────────────────────────────────────┐
│  Leave Requests                    [Apply for Leave]    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Total Balance│  │   Approved   │  │   Pending    │  │
│  │   12 Days    │  │    2 Days    │  │    1 Day     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Leave History                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Type  │ Start Date │ End Date │ Reason │ Status │   │
│  ├───────┼────────────┼──────────┼────────┼────────┤   │
│  │ Sick  │ Jan 20     │ Jan 21   │ Fever  │ 🟡     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Institution Portal
```
┌─────────────────────────────────────────────────────────┐
│  Leave Approval                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │ Staff │ Role │ Dates │ Type │ Status │ Actions │   │
│  ├───────┼──────┼───────┼──────┼────────┼─────────┤   │
│  │ John  │ PROF │ Jan20 │ Sick │ 🟡     │ [View]  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

When you click [View Details]:
┌──────────────────────────────┐
│  Leave Request Details       │
├──────────────────────────────┤
│  👤 Dr. John Doe             │
│     PROFESSOR                │
├──────────────────────────────┤
│  📄 Type: Sick Leave         │
│  📅 Jan 20 — Jan 21, 2026    │
│  💬 Reason: Medical appt.    │
├──────────────────────────────┤
│  [✓ Approve]  [✗ Deny]       │
└──────────────────────────────┘
```

---

## ✅ Testing Checklist

### Test 1: Submit Leave Request
- [ ] Login as faculty member
- [ ] Navigate to Leave Requests page
- [ ] Click "Apply for Leave"
- [ ] Fill all fields
- [ ] Submit successfully
- [ ] See request in Leave History with "Pending" status

### Test 2: Approve Leave
- [ ] Login as institution admin
- [ ] Navigate to Leave Approval page
- [ ] Find the pending request
- [ ] Click "View Details"
- [ ] Click "Approve"
- [ ] See status change to "Approved"

### Test 3: Real-time Updates
- [ ] Open two browser windows (faculty + institution)
- [ ] Submit leave from faculty panel
- [ ] Verify it appears in institution panel instantly
- [ ] Approve from institution panel
- [ ] Verify status updates in faculty panel instantly

---

## 🚀 Next Steps (Optional Enhancements)

1. **Email Notifications**
   - Send email when leave is approved/rejected
   - Remind admins of pending requests

2. **Leave Balance Calculation**
   - Track actual remaining days per leave type
   - Show warnings when balance is low

3. **Calendar Integration**
   - Display approved leaves on institution calendar
   - Show who's on leave today

4. **Reporting**
   - Generate monthly leave reports
   - Export leave data to Excel

5. **Advanced Features**
   - Bulk approval
   - Comments/notes on requests
   - Attachment support (medical certificates)
   - Substitute teacher assignment

---

## 🐛 Troubleshooting

### Problem: Leave request not showing in institution portal
**Solution:**
- Verify both users belong to same institution
- Check browser console for errors
- Refresh the page

### Problem: Status not updating in real-time
**Solution:**
- Check internet connection
- Verify Supabase real-time is enabled
- Check browser console for subscription errors

### Problem: Cannot submit leave request
**Solution:**
- Ensure all fields are filled
- Check date format
- Verify you're logged in as faculty

---

## 📝 Summary

✅ **Faculty Panel** - Submit and track leave requests  
✅ **Institution Portal** - Review and approve/reject requests  
✅ **Real-time Sync** - Instant updates on both sides  
✅ **Database** - All data stored securely in Supabase  
✅ **User-friendly** - Clean, intuitive interface  

The leave approval system is **fully functional** and ready to use! 🎉
