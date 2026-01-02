# Enhanced Loan Management Features

## Overview
The SACCO system now includes advanced loan management features with support for multiple loan types and loan top-ups.

---

## 1. Loan Type Categories

### For Members Only:
- **Normal Loan**: 2% interest rate
- **Emergency Loan**: 5% interest rate

### For Non-Members:
- **Non-Member Loan**: 10% interest rate

---

## 2. Create New Loan

### Access
- Navigate to **Loans** tab
- Click **"New Loan"** tab in the loans management section

### Features
- **Borrower Type Selection**: Choose between Member or Non-Member
- **Dynamic Loan Type Options**: 
  - Members see: Normal Loan, Emergency Loan
  - Non-Members see: Non-Member Loan only
- **Automatic Interest Rate**: Interest rate auto-populates based on loan type
- **Real-time Calculation**: Monthly installment calculates automatically as you enter data
- **Lending Pool Check**: System validates against total collective savings

### Form Fields
1. Borrower Type (dropdown)
2. Member/Non-Member Name (conditional)
3. Loan Type (dropdown - changes based on borrower type)
4. Loan Amount (UGX)
5. Loan Term (months)
6. Interest Rate (auto-filled, readonly)
7. Loan Date
8. Monthly Installment (auto-calculated)

### Validation
- Loan amount cannot exceed available lending pool
- All required fields must be filled
- Amount and term must be greater than 0

---

## 3. Top Up Existing Loan

### Access
- Navigate to **Loans** tab
- Click **"Top Up Loan"** tab in the loans management section

### Features
- **Select Active Loans**: Only active loans are available for top-up
- **Current Loan Details**: Displays original amount, interest rate, and remaining balance
- **Real-time Calculation**: New total amount shows as you enter top-up amount
- **Automatic Due Date Extension**: Due date extends proportionally based on top-up amount
- **History Tracking**: All top-ups are recorded in the loan's top-up history

### Form Fields
1. Select Loan to Top Up (dropdown)
2. Current Loan Details (display only)
   - Original Amount
   - Interest Rate
   - Remaining Balance
3. Top Up Amount (UGX)
4. Top Up Date
5. New Total Amount (auto-calculated)

### Process
1. Select an active loan from dropdown
2. Review current loan details
3. Enter additional amount needed
4. Enter top-up date
5. Review new total amount
6. Click "Process Top Up"

### Validation
- Loan must exist and be active
- Top-up amount must be greater than 0
- Total (original + top-up) cannot exceed available lending pool
- All required fields must be filled

---

## 4. Loan Records Table

### Columns
| Column | Description |
|--------|-------------|
| Member | Borrower name (member or non-member) |
| Loan Type | Type badge (Normal, Emergency, Non-Member) |
| Amount | Current total loan amount |
| Interest | Interest rate percentage |
| Monthly Payment | Calculated monthly installment |
| Due Date | Loan maturity date |
| Status | Active, Overdue, or Completed |
| Remaining | Outstanding balance |
| Actions | View, Edit, Delete, Penalty (if overdue) |

### Features
- Search/filter loans
- View detailed loan information
- Apply penalties to overdue loans
- Edit loan details
- Delete loans (with confirmation)

---

## 5. Data Structure Updates

### Loan Object Properties
```javascript
{
  id: string,
  memberId: string (nullable for non-members),
  borrowerType: 'member' | 'non-member',
  loanType: 'normal' | 'emergency' | 'non-member',
  borrowerName: string (for non-members),
  amount: number (total including top-ups),
  term: number (in months),
  interestRate: number (2, 5, or 10),
  loanDate: date string,
  dueDate: date string (updated with top-ups),
  paid: number (amount repaid so far),
  status: 'active' | 'completed' | 'cancelled',
  topUps: [ // Array of top-up transactions
    {
      amount: number,
      date: date string,
      timestamp: ISO date string
    }
  ]
}
```

---

## 6. Audit Trail

### Logged Events
- **LOAN_CREATED**: New loan creation with type and interest rate
- **LOAN_TOPUP**: Loan top-up with new total amount

### Example Log Entries
```
LOAN_CREATED: Normal loan of UGX 5,000,000 (2%) created for John Doe
LOAN_CREATED: Emergency loan of UGX 2,000,000 (5%) created for Jane Smith
LOAN_CREATED: Non-Member Loan of UGX 3,000,000 (10%) created for External Borrower
LOAN_TOPUP: Top up of UGX 1,000,000 added to loan abc12345. New total: UGX 6,000,000
```

---

## 7. Lending Pool Constraints

Both new loans and top-ups respect the following:
- **Available Pool** = Total Collective Savings - Total Withdrawals - Total Currently Loaned Out
- System prevents loans/top-ups that exceed the available pool
- Error message shows the limit if transaction is rejected

---

## 8. Interest Rate Reference

| Loan Type | Borrower | Rate | Use Case |
|-----------|----------|------|----------|
| Normal | Member | 2% | Regular member loans |
| Emergency | Member | 5% | Urgent member needs |
| Non-Member | Non-Member | 10% | External borrowers |

---

## 9. Due Date Calculation for Top-Ups

When a loan is topped up:
1. Calculate proportion: `top-up amount / original amount`
2. Calculate additional months: `ceil(original term × proportion)`
3. Extend due date by calculated months

**Example**:
- Original loan: UGX 5,000,000, 12 months
- Top-up: UGX 2,500,000 (50% of original)
- Additional months: ceil(12 × 0.5) = 6 months
- New due date: +6 months from original due date

---

## 10. Monthly Installment Calculation

**Formula**: `(Amount + Total Interest) / Term`

Where:
- **Total Interest** = `(Amount × Interest Rate × Term) / (12 × 100)`
- **Term** = Duration in months

**Example**:
- Amount: UGX 5,000,000
- Rate: 2%
- Term: 12 months
- Total Interest: (5,000,000 × 2 × 12) / 1200 = 1,000,000
- Total Amount: 5,000,000 + 1,000,000 = 6,000,000
- Monthly Payment: 6,000,000 / 12 = 500,000

---

## 11. Notifications & Alerts

### Success Messages
- ✅ Loan created successfully
- ✅ Loan top up processed successfully

### Warning Messages
- ⚠️ Please fill in all required fields
- ⚠️ Amount and term must be greater than 0
- ⚠️ Loan amount exceeds available lending pool
- ⚠️ Cannot process top up: Amount exceeds available lending pool

### Error Messages
- ❌ Selected member not found
- ❌ Loan not found
- ❌ Error creating loan: [details]
- ❌ Error processing top up: [details]

---

## 12. System Integration

### Updates UI Components
- Loan records table refreshes with new loans/top-ups
- Dashboard statistics update
- Reports regenerate with latest data
- Recent activity shows new transactions

### Triggers Events
- `loansUpdated` custom event dispatched
- Payment reminder checker resets to check immediately
- Member notifications sent (for member loans)

---

## 13. Best Practices

### When Creating Loans
✅ Always verify the borrower exists (for members)
✅ Check available lending pool before approval
✅ Use appropriate loan type for borrower circumstances
✅ Set realistic repayment terms

### When Processing Top-Ups
✅ Review current loan status before approval
✅ Ensure additional funds are available in the pool
✅ Update loan records with top-up history
✅ Communicate due date extension to borrower

### Member Communication
✅ Notify members immediately after loan creation
✅ Send payment reminders before due dates
✅ Alert about overdue payments
✅ Confirm top-up details with member

---

## 14. Reports & Analytics

The system automatically tracks:
- Total loans by type (Normal, Emergency, Non-Member)
- Interest income by loan type
- Default rates
- Top-up frequency and amounts
- Borrower profiles (member vs non-member)
- Outstanding balances
- Repayment performance

---

*Last Updated: January 2, 2025*
