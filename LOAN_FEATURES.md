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
   - Shows: Loan ID, Borrower/Member Name, Remaining Balance
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

### Overview
Comprehensive financial analytics and performance monitoring dashboard providing real-time insights into lending operations, member activity, and institutional health. All metrics update automatically and support custom date range filtering.

---

### 14.1 Key Performance Indicators (KPIs)

#### Primary Metrics
| Metric | Description | Business Value |
|--------|-------------|-----------------|
| Total Active Loans | Sum of all non-completed loans | Portfolio size monitoring |
| Portfolio Amount | Total outstanding loan balance | Capital at risk exposure |
| Total Interest Income | Cumulative interest earned to date | Revenue tracking |
| Repayment Rate | % of on-time payments vs total due | Credit quality indicator |
| Default Rate | % of overdue/defaulted loans | Risk assessment |
| Average Loan Size | Mean loan amount across portfolio | Member lending profile |
| Member Participation | % of members with active loans | Engagement metric |

#### Display Format
- Large numeric cards with trend indicators (↑↓)
- Month-over-month and year-over-year comparisons
- Color-coded status (green: healthy, yellow: caution, red: alert)
- Real-time updates on dashboard load

---

### 14.2 Loan Portfolio Analysis

#### Chart 1: Loan Type Distribution
**Type**: Doughnut Chart
**Dimensions**: 400px × 400px
**Spacing**: 60px bottom margin, 40px sides
**Metrics**:
- Normal Loans (count & total amount)
- Emergency Loans (count & total amount)
- Non-Member Loans (count & total amount)

**Data Elements**:
- Count of active loans per type
- Total outstanding balance per type
- Percentage of portfolio
- Hover tooltip: Loan type | Count | Amount | % of portfolio

**Color Scheme**:
- Normal: #4A90E2 (Professional Blue)
- Emergency: #F5A623 (Warning Orange)
- Non-Member: #7ED321 (Success Green)

---

#### Chart 2: Loan Status Overview
**Type**: Horizontal Bar Chart
**Dimensions**: 100% width × 250px
**Spacing**: 80px bottom margin, 40px top, 40px sides
**Metrics**:
- Active Loans
- Completed Loans
- Overdue Loans
- Cancelled Loans

**Data Elements**:
- Absolute count per status
- Percentage of total loan count
- Hover detail: Status | Count | % | Amount outstanding

**Color Scheme**:
- Active: #50C878 (Green)
- Completed: #B0B0B0 (Gray)
- Overdue: #FF4444 (Red)
- Cancelled: #D0D0D0 (Light Gray)

---

### 14.3 Financial Performance

#### Chart 3: Interest Income Trend
**Type**: Line Chart with Area Fill
**Dimensions**: 100% width × 300px
**Spacing**: 100px bottom margin, 40px top, 40px sides
**Metrics**:
- Monthly cumulative interest earned
- Interest by loan type (stacked area)
- Trend line (12-month rolling average)
- Projection for next quarter

**Granularity Options**:
- By Day (last 30 days)
- By Week (last 12 weeks)
- By Month (last 24 months)
- By Year (all time)

**Data Elements**:
- Interest earned (UGX)
- Percentage change from previous period
- Projection confidence interval (shaded)

**Color Scheme**:
- Normal Interest: #4A90E2 (Blue)
- Emergency Interest: #F5A623 (Orange)
- Non-Member Interest: #7ED321 (Green)
- Trend: #222 (Dark)

---

#### Chart 4: Interest Income Breakdown (By Loan Type)
**Type**: Stacked Column Chart
**Dimensions**: 100% width × 280px
**Spacing**: 80px bottom margin, 40px top, 40px sides
**Metrics**:
- Interest income by loan type per month
- Cumulative total per period
- Year-to-date comparison

**Data Elements**:
- Absolute amount (UGX) per type
- Percentage contribution
- Hover: Month | Type | Amount | % of monthly total

---

### 14.4 Loan Performance Metrics

#### Chart 5: Repayment Performance
**Type**: Combination Chart (Bar + Line)
**Dimensions**: 100% width × 320px
**Spacing**: 100px bottom margin, 40px top, 40px sides
**Metrics**:
- On-Time Payments (bar)
- Late Payments (bar)
- Repayment Rate % (line overlay)

**Data Elements**:
- Monthly payment count
- Days overdue distribution
- Repayment rate percentage
- Target rate indicator (95% benchmark line)

**Color Scheme**:
- On-Time: #50C878 (Green)
- Late: #FF9800 (Orange)
- Rate Line: #333 (Dark)
- Target Line: #F44336 (Red, dashed)

---

#### Chart 6: Default Rate Analysis
**Type**: Gauge Chart + Trend Table
**Dimensions**: 400px × 300px + Table 100% width
**Spacing**: 80px bottom margin, 40px sides
**Metrics**:
- Current default rate percentage
- Default accounts count
- Default amount (UGX)
- Default trend (3, 6, 12 months)

**Gauge Ranges**:
- 0-2%: Green (Healthy)
- 2-5%: Yellow (Moderate)
- 5-10%: Orange (Elevated)
- 10%+: Red (High Risk)

**Trend Table**:
| Period | Accounts | Amount | Rate | Trend |
|--------|----------|---------|------|-------|
| Last 30 days | # | UGX | % | ↑↓ |
| Last 90 days | # | UGX | % | ↑↓ |
| Last 6 months | # | UGX | % | ↑↓ |
| YTD | # | UGX | % | ↑↓ |

---

### 14.5 Member & Borrower Analytics

#### Chart 7: Member vs Non-Member Comparison
**Type**: Grouped Bar Chart
**Dimensions**: 100% width × 300px
**Spacing**: 90px bottom margin, 40px top, 40px sides
**Metrics**:
- Count of member loans vs non-member loans
- Total amount loaned (members vs non-members)
- Average loan size per category
- Repayment performance comparison

**Data Elements**:
- Absolute counts
- Comparison percentages
- Hover: Category | Count | Amount | Avg Size | Repayment %

**Color Scheme**:
- Member: #4A90E2 (Blue)
- Non-Member: #7ED321 (Green)

---

#### Chart 8: Top Borrowers
**Type**: Horizontal Bar Ranking
**Dimensions**: 100% width × 400px
**Spacing**: 80px bottom margin, 40px top, 40px sides
**Limit**: Top 10 borrowers
**Metrics**:
- Total amount borrowed
- Number of loans
- Repayment status
- Average loan term

**Columns**:
| Rank | Borrower | Type | Loans | Amount | Status | Repayment % |
|------|----------|------|-------|---------|--------|------------|
| 1 | Name | Member | # | UGX | Active/Overdue/Completed | % |

**Color Coding**:
- Status column: Green (On-track), Orange (At-risk), Red (Defaulted)

---

### 14.6 Operational Metrics

#### Chart 9: Loan Top-Up Activity
**Type**: Area Chart + Statistics
**Dimensions**: 100% width × 300px
**Spacing**: 90px bottom margin, 40px top, 40px sides
**Metrics**:
- Monthly top-up frequency (count)
- Top-up amount volume (UGX)
- Average top-up size
- Top-up to original ratio

**Data Elements**:
- Top-up count per month (area)
- Average amount per top-up (line)
- Percentage of loans with at least 1 top-up

**Statistics Box**:
```
Total Top-Ups: [count]
Total Top-Up Amount: UGX [amount]
Avg Top-Up Size: UGX [amount]
Loans with Top-Ups: [%]
```

**Color Scheme**:
- Count Area: #FF6B6B (Red, semi-transparent)
- Average Line: #222 (Dark)

---

#### Chart 10: Loan Creation & Closure Trends
**Type**: Combination Chart
**Dimensions**: 100% width × 320px
**Spacing**: 100px bottom margin, 40px top, 40px sides
**Metrics**:
- New loans created per month
- Loans completed per month
- Net portfolio growth
- Average loan lifecycle (days)

**Data Elements**:
- Monthly creation count (bar)
- Monthly closure count (bar)
- Net change (line)
- Portfolio growth trajectory

**Color Scheme**:
- Created: #50C878 (Green)
- Closed: #B0B0B0 (Gray)
- Net: #4A90E2 (Blue line)

---

### 14.7 Outstanding Balance & Collections

#### Chart 11: Outstanding Balance By Maturity
**Type**: Stacked Area Chart
**Dimensions**: 100% width × 300px
**Spacing**: 90px bottom margin, 40px top, 40px sides
**Metrics**:
- Outstanding amount due within 30 days
- Due within 31-60 days
- Due within 61-90 days
- Due after 90 days

**Data Elements**:
- Absolute amount (UGX) per bucket
- Percentage of total outstanding
- Number of loans per bucket

**Color Scheme**:
- 0-30 days: #50C878 (Green)
- 31-60 days: #FFD700 (Yellow)
- 61-90 days: #FF9800 (Orange)
- 90+ days: #F44336 (Red)

---

#### Chart 12: Collections Pipeline
**Type**: Funnel Chart
**Dimensions**: 500px × 350px
**Spacing**: 80px bottom margin, 40px sides
**Metrics**:
- Total outstanding balance
- Expected collections (next 30 days)
- Collections achieved (last 30 days)
- Collection rate %

**Funnel Stages**:
1. Total Outstanding: UGX [amount]
2. Due Next 30 Days: UGX [amount] ([%])
3. Expected Collections: UGX [amount] ([%])
4. Actual Collections: UGX [amount] ([%])

**Color Progression**: Green → Yellow → Orange → Red

---

### 14.8 Report Filters & Controls

#### Date Range Selector
- Preset options: Last 7 days | Last 30 days | Last 90 days | YTD | Custom
- Calendar picker for custom date ranges
- Applies to all charts simultaneously

#### Filter Options
- **By Loan Type**: Normal | Emergency | Non-Member | All
- **By Member Status**: Member | Non-Member | All
- **By Loan Status**: Active | Completed | Overdue | Cancelled | All
- **By Amount Range**: Slider control (min - max)

#### Chart Controls
- **Export**: Download as PNG, PDF, Excel
- **Refresh**: Manual refresh button
- **Fullscreen**: Expand any chart to full screen
- **Data Table**: Toggle table view for any chart
- **Comparison**: Select period to compare with current

---

### 14.9 Summary Statistics Box

#### Header Section (Always Visible)
**Type**: Metric Cards Grid
**Dimensions**: 100% width
**Spacing**: 20px between cards, 40px padding

**Layout Grid** (2 rows × 4 columns):
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          PORTFOLIO SUMMARY                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                     │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐                   │
│  │ Active Loans       │  │ Outstanding Bal.   │  │ Total Interest     │  │ Repayment Rate     │                   │
│  │ [count]            │  │ UGX [amount]       │  │ UGX [amount]       │  │ [%] ↑              │                   │
│  │ ↑ [+x% MoM]        │  │ ↑ [+x% MoM]        │  │ ↑ [+x% MoM]        │  │ ↑ [+x pts]         │                   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘  └────────────────────┘                   │
│                                                                                                                     │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐                   │
│  │ Default Rate       │  │ Members w/ Loans   │  │ Avg Loan Size      │  │ Collection Rate    │                   │
│  │ [%]                │  │ [count] ([%])      │  │ UGX [amount]       │  │ [%] ↑              │                   │
│  │ ↓ [-x pts]         │  │ ↑ [+x members]     │  │ ↑ [+x% MoM]        │  │ ↑ [+x pts]         │                   │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘  └────────────────────┘                   │
│                                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Card Specifications**:
- Each card: Flex grow (equal width, responsive)
- Background: Light gray (#F5F5F5)
- Border: 1px solid #E0E0E0
- Border-radius: 4px
- Padding: 20px
- Box-shadow: 0 1px 3px rgba(0,0,0,0.08)

**Typography**:
- Title: 12px, #666, uppercase, letter-spacing 0.5px
- Value: 24px bold, #222
- Trend: 14px, green (#50C878) or red (#FF4444), with icon
- MoM Change: 12px, #999

**Color Coding**:
- Positive trend: Green (#50C878) with ↑
- Negative trend: Red (#FF4444) with ↓
- Neutral: Gray (#999)

---

### 14.10 Data Refresh & Performance

#### Auto-Refresh Settings
- Default: Every 5 minutes
- Manual refresh available
- Last updated timestamp displayed
- Loading indicator during refresh

#### Data Caching
- Client-side: 5-minute cache
- Server-side: 1-minute aggregation
- Optimized queries for large datasets

---

### 14.11 Export & Reporting

#### Standard Reports
- **Monthly Summary Report**: KPIs + key charts (PDF/Excel)
- **Portfolio Statement**: Complete loan listing with performance
- **Collection Report**: Outstanding amounts by status
- **Member Lending Report**: Individual member loan history
- **Default Risk Report**: At-risk accounts with details

#### Custom Report Builder
- Select date range
- Choose metrics to include
- Select visualization style
- Add custom notes/header
- Generate as PDF or Excel
- Schedule automated delivery (email, weekly/monthly)

---

### 14.12 Mobile Responsive Design

#### Tablet View (768px - 1024px)
- Charts stack vertically
- 2-column KPI grid
- Touch-friendly controls

#### Mobile View (<768px)
- Single-column layout
- Simplified charts (reduced data points)
- Swipe navigation between sections
- Pinch-to-zoom on charts
- Collapsible filter panel

---

### 14.13 Data Validation & Accuracy

#### Audit Features
- Every calculation logged with timestamp
- Source data reference for all metrics
- Variance alert if change >15% day-over-day
- Data integrity check on load
- Reconciliation report available

#### Business Rules
- Overdue defined as: Due date < today
- Default defined as: Overdue >30 days
- Interest calculated using configured formula
- Collections counted only when payment received
- Top-ups properly tracked in loan history

---

*Last Updated: January 2, 2025*
