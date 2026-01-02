# Testing Guide: Enhanced Loan Management Features

## Test Environment Setup

### Prerequisites
- Create at least 2-3 members with savings
- Ensure total collective savings > UGX 10,000,000
- Clear any existing loans if needed for fresh testing

---

## Test Case 1: Create Member - Normal Loan

### Steps
1. Go to **Loans** tab
2. Under "Create New Loan" tab:
   - **Borrower Type**: Select "Member"
   - **Member**: Select an existing member
   - **Loan Type**: Select "Normal Loan (2%)"
   - **Amount**: 5,000,000
   - **Term**: 12 months
   - **Loan Date**: Today

### Expected Results
✅ Interest Rate field shows: 2
✅ Monthly Installment calculates: UGX 416,667 (approximately)
✅ Loan created successfully
✅ Loan appears in table with:
   - Loan Type badge: "Normal"
   - Interest column: 2%
   - Correct monthly payment

---

## Test Case 2: Create Member - Emergency Loan

### Steps
1. Go to **Loans** tab
2. Under "Create New Loan" tab:
   - **Borrower Type**: Select "Member"
   - **Member**: Select a different member
   - **Loan Type**: Select "Emergency Loan (5%)"
   - **Amount**: 3,000,000
   - **Term**: 6 months
   - **Loan Date**: Today

### Expected Results
✅ Interest Rate field shows: 5
✅ Monthly Installment calculates: UGX 512,500
✅ Loan created successfully
✅ Loan appears in table with:
   - Loan Type badge: "Emergency"
   - Interest column: 5%

---

## Test Case 3: Create Non-Member Loan

### Steps
1. Go to **Loans** tab
2. Under "Create New Loan" tab:
   - **Borrower Type**: Select "Non-Member"
   - **Non-Member Name**: Enter "John Doe"
   - **Loan Type**: Only shows "Non-Member Loan (10%)"
   - **Amount**: 2,000,000
   - **Term**: 12 months
   - **Loan Date**: Today

### Expected Results
✅ Member select hides, name field shows
✅ Loan Type dropdown only shows "Non-Member Loan (10%)"
✅ Interest Rate field shows: 10
✅ Monthly Installment calculates correctly
✅ Loan created successfully
✅ Loan appears in table with:
   - Loan Type badge: "Non-member"
   - Member column shows: "John Doe"
   - Interest column: 10%

---

## Test Case 4: Validate Lending Pool Constraint

### Steps
1. Create a loan with amount larger than available pool
2. Example: If total savings is 10M and existing loans are 8M:
   - Try to create loan for 3,000,000
   - Expected max available: 2,000,000

### Expected Results
❌ Error message: "Cannot issue loan: Loan amount (UGX 3,000,000) exceeds available lending pool (UGX 2,000,000)..."
❌ Loan not created
✅ All existing loans remain unchanged

---

## Test Case 5: Top Up Existing Loan

### Steps
1. Go to **Loans** tab
2. Click **"Top Up Loan"** tab
3. **Select Loan to Top Up**: Choose the Normal Loan created in Test Case 1
4. Review displayed details:
   - Original Amount: 5,000,000
   - Interest Rate: 2%
   - Remaining Balance: Should be close to 5,000,000 (if no payments made)
5. Enter:
   - **Top Up Amount**: 1,000,000
   - **Top Up Date**: Today
6. Click "Process Top Up"

### Expected Results
✅ New Total Amount displays: 6,000,000
✅ Top up processed successfully
✅ Loan amount in table updates to 6,000,000
✅ Due date extends by ~1 month (proportional)
✅ Audit log records the transaction

---

## Test Case 6: Top Up Only Works on Active Loans

### Steps
1. Complete a loan (mark as completed or fully repaid)
2. Go to **Loans** > **"Top Up Loan"** tab
3. Try to select the completed loan

### Expected Results
❌ Completed loans should not appear in the dropdown
✅ Only active loans are available for top-up

---

## Test Case 7: Loan Calculations on Input Change

### Steps
1. Go to **Loans** > **"Create New Loan"** tab
2. Select Borrower Type: Member
3. Select Member
4. Select Loan Type: Emergency (5%)
5. Enter:
   - Amount: 5,000,000
   - Term: 12 months
   - Observe Monthly Installment

6. Change Amount to: 10,000,000
   - Observe Monthly Installment updates immediately

7. Change Term to: 24 months
   - Observe Monthly Installment updates again

### Expected Results
✅ Monthly Installment updates in real-time as each field changes
✅ Calculations are correct for all combinations
✅ Formula: (Amount + Interest) / Term

---

## Test Case 8: Form Validation

### Test 8a: Missing Fields
1. Try to submit loan form with empty fields
### Expected Results
❌ "Please fill in all required fields" warning

### Test 8b: Invalid Numbers
1. Enter Amount: 0
2. Try to submit
### Expected Results
❌ "Amount and term must be greater than 0" warning

### Test 8c: Conditional Required Fields
1. Select Borrower Type: Member, but don't select member
2. Try to submit
### Expected Results
❌ "Please select a member" warning

---

## Test Case 9: Reports Update with New Loans

### Steps
1. Check **Reports** tab - note loan counts
2. Create a new loan (any type)
3. Return to **Reports** tab

### Expected Results
✅ Total Loans count increases
✅ Total Loaned amount updates
✅ Loan type breakdown shows new loan
✅ Outstanding balance updates correctly

---

## Test Case 10: Dashboard Statistics Update

### Steps
1. Check **Dashboard** > stats
2. Create a loan
3. Check Dashboard again

### Expected Results
✅ "Outstanding" balance increases
✅ "Active Loans" count increases
✅ Recent Activity shows new loan

---

## Test Case 11: Audit Log Records

### Steps
1. Go to **Settings & Features** sidebar
2. Click **Audit Log**
3. Search for LOAN_CREATED and LOAN_TOPUP entries

### Expected Results
✅ Each loan creation logged with type and rate
✅ Example: "Normal loan of UGX 5,000,000 (2%) created for [Member Name]"
✅ Each top-up logged with amount and new total
✅ Example: "Top up of UGX 1,000,000 added to loan abc12345. New total: UGX 6,000,000"

---

## Test Case 12: Member Notifications (if enabled)

### Steps
1. Create a loan for a member
2. Check member's notifications

### Expected Results
✅ Member receives notification about new loan
✅ Member receives notification about top-up (if applicable)
✅ Notifications include loan ID and amount

---

## Regression Testing

After implementing the new features, verify:

### Existing Loan Functions Still Work
- [ ] Create loan (original single-type functionality)
- [ ] View loan details
- [ ] Edit loan information
- [ ] Delete loan (with confirmation)
- [ ] Apply penalty to overdue loans
- [ ] Record payments against loans
- [ ] Loan search/filter in table

### Dashboard Still Works
- [ ] Dashboard loads correctly
- [ ] All statistics display
- [ ] Recent activity shows transactions
- [ ] Member filter works

### Reports Still Work
- [ ] All reports generate correctly
- [ ] Loan reports include all types
- [ ] Financial reports accurate
- [ ] Charts update correctly

### Data Persistence
- [ ] Loans saved to browser storage
- [ ] Top-up data persists after refresh
- [ ] Audit logs persist
- [ ] Can export data with new fields

---

## Performance Testing

### Load Testing
- Create 50+ loans of various types
- Verify table performance remains acceptable
- Check dropdown performance with many loans

### Calculation Performance
- Enter/change values rapidly
- Verify calculations happen without lag
- Check form responsiveness

---

## Edge Cases to Test

1. **Top-up larger than original loan**
   - Example: Original 1M, top-up 10M
   - Should work if pool allows

2. **Multiple top-ups on same loan**
   - Top-up same loan 3 times
   - Verify history shows all top-ups
   - Verify due date extends cumulatively

3. **Non-member with same name as member**
   - Create both member "John Doe" and non-member "John Doe"
   - Verify system doesn't confuse them

4. **Top-up with zero remaining balance**
   - Pay off loan completely
   - Verify loan marked as completed
   - Verify can't top-up completed loan

5. **Switching borrower type**
   - Select Member, then switch to Non-Member
   - Verify form fields update correctly
   - Verify loan types reset

---

## Browser Compatibility Testing

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## Success Criteria

All tests should pass:
- ✅ All calculations accurate to nearest UGX 100
- ✅ All validations work correctly
- ✅ All UI updates happen in real-time
- ✅ All data persists correctly
- ✅ All notifications/alerts display properly
- ✅ No console errors
- ✅ No broken existing functionality

---

*Last Updated: January 2, 2025*
