# Risk Score Components

This directory contains components for displaying the Risk Score.
**Remember:** Risk calculation happens ONLY in the backend.

## Components

### 1. `RiskScoreCard.tsx`
Display detailed risk information including:
- Gauge chart (0-100)
- Risk Category (LOW, MEDIUM, HIGH)
- Detailed rationale breakdown

**Usage:**
```tsx
import { RiskScoreCard } from './RiskScoreCard';

// To display current user's score
<RiskScoreCard />

// To display another user's score (Admin/Auditor only)
<RiskScoreCard userId={123} />

// Compact mode
<RiskScoreCard compact />
```

### 2. `RiskBadge.tsx`
Small visual indicator for lists and tables.

**Usage:**
```tsx
import { RiskBadge } from './RiskBadge';

<RiskBadge category="HIGH" score={85} showScore />
```

### 3. `RiskScoreWidget.tsx`
Wrapper for dashboard use cases.

## Service

Use `riskService` for all API calls.

```ts
import { riskService } from '../services/riskService';

const myScore = await riskService.getMyScore();
const distribution = await riskService.getDistribution();
```
