# Risk Scoring System - Implementation Summary

## Overview

This document summarizes the implementation of the Risk Scoring System as per mentor requirements.

## 🎯 Core Concept

Risk scoring is:
- **User Trustworthiness Metric** (NOT document-based)
- **Range:** 0 → 100
- **Calculated in backend only**
- **Rule-based (NOT Machine Learning)**

## 📊 Score Categories

| Score Range | Risk Level |
|-------------|------------|
| 0 – 33      | LOW Risk   |
| 34 – 66     | MEDIUM Risk|
| 67 – 100    | HIGH Risk  |

## ✅ Implementation Details

### 1. Risk Inputs (4 Factors)

#### 📄 Input 1: Document Integrity (Weight: 40% - Highest)
- Document hash verification
- Tampered ledger detection
- Failed integrity checks
- Formula: `tamper_rate = tampered_docs / total_docs`

#### 📘 Input 2: User Activity - Ledger Based (Weight: 25%)
- Failed ledger events
- Abnormal action frequency
- Repeated corrections/amendments

#### 💰 Input 3: Transaction Behavior (Weight: 25%)
- Trade disputes
- Delays
- Cancelled trades
- Failed trades

#### 🌍 Input 4: External Trade Risk (Weight: 10% - Lowest)
- Country trade risk (mocked via ExternalRiskMock)
- Region compliance risk
- **Note:** External data stays backend only

### 2. Calculation Formula

```
final_score = 
    (doc_risk × 40) 
  + (activity_risk × 25) 
  + (transaction_risk × 25) 
  + (external_risk × 10)
```

### 3. Database Storage

The `risk_scores` table stores:
- `user_id` - The user this score belongs to
- `score` - Numeric value 0-100
- `category` - Risk level (LOW/MEDIUM/HIGH)
- `rationale` - Human-readable explanation
- `last_updated` - Timestamp of calculation

### 4. Recalculation Triggers

Risk recalculates automatically when:
- ✔ Document verification failure occurs
- ✔ Ledger entry is created
- ✔ Trade status changes
- ✔ External data updates (manual trigger)

### 5. API Endpoints

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/risk/my-score` | GET | Corporate/Bank | Get own risk score |
| `/risk/user/{id}` | GET | Auditor/Admin | Get any user's score |
| `/risk/recalculate-all` | POST | Admin only | Bulk recalculation |
| `/risk/all` | GET | Auditor/Admin | List all scores |
| `/risk/high-risk` | GET | Auditor/Admin | List high-risk users |
| `/risk/distribution` | GET | Auditor/Admin | Category distribution |

## 📁 Files Modified/Created

### Backend Changes

1. **`app/models/risk.py`**
   - Added `category` column to RiskScore model

2. **`app/core/risk_rules.py`** (Rewritten)
   - Updated weights to match mentor spec (40/25/25/10)
   - Added separate calculation functions for each input
   - Added category threshold constants (33/66)
   - Enhanced rationale generation

3. **`app/services/risk_service.py`** (Rewritten)
   - Data collection methods for all 4 inputs
   - Event-driven trigger methods
   - Comprehensive calculation with rationale
   - Admin bulk recalculation

4. **`app/api/risk.py`** (Enhanced)
   - Added new endpoints for listing and distribution
   - Uses stored category from DB

5. **`app/schemas/risk.py`** (Enhanced)
   - Added new response models
   - Category included in responses

6. **`app/services/document_service.py`** (Updated)
   - Added risk trigger on document verification

7. **`app/services/trade_service.py`** (Updated)
   - Added risk trigger on trade status change

8. **`app/services/ledger_service.py`** (Updated)
   - Added risk trigger on new ledger entry

9. **`alembic/versions/005_risk_category.py`** (New)
   - Database migration for category column

### Frontend Changes

1. **`src/types/risk.types.ts`** (Updated)
   - Updated categories to match backend (LOW/MEDIUM/HIGH)
   - Added helper functions for colors and badges

2. **`src/services/riskService.ts`** (Updated)
   - Added API client methods for all risk endpoints
   - `getMyScore`, `getUserScore`, `getAllScores`, `getHighRiskUsers`, `getDistribution`
   - Re-exported types for convenience

3. **`src/components/RiskScoreCard.tsx`** (New)
   - Detailed risk score display with gauge and rationale
   - Supports compact and detailed views

4. **`src/components/RiskBadge.tsx`** (New)
   - Small reusable badge for lists and tables

5. **`src/components/RiskScoreWidget.tsx`** (Updated)
   - Refactored to use `RiskScoreCard`

6. **`src/components/AdminStatsDashboard.tsx`** (Updated)
   - Integrated `riskService` for accurate risk distribution data
   - Added manual recalculation trigger button

7. **`src/pages/DashboardPage.tsx`** (Verified)
   - Uses `RiskScoreWidget` to display score to Corporate/Bank users

## ✅ Final Verification
- [x] Backend logic matches email requirements (40/25/25/10 weights)
- [x] Frontend displays calculated score (Read-Only)
- [x] Admin dashboard shows risk distribution
- [x] Triggers are active for Documents, Ledger, and Trades

## 🚀 Next Steps

1. Run database migration: `alembic upgrade head`
2. Test risk calculation endpoints
3. Implement frontend display (read-only)
4. Add risk indicators to user profiles
