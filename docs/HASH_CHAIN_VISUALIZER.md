# Hash Chain Visualizer - Interactive Hashing UI

## Overview

The **HashChainVisualizer** component provides a comprehensive, interactive UI for visualizing the blockchain-style hash chain that ensures document integrity in the Trade Finance Blockchain Explorer.

**Created**: 2026-02-09  
**Component Location**: `frontend/src/components/HashChainVisualizer.tsx`  
**Used In**: `DocumentDetailsPage.tsx`

---

## Features

### 🎯 Key Capabilities

1. **Interactive Hash Display**
   - Click to expand/collapse individual ledger entries
   - Full hash visibility with copy-to-clipboard functionality
   - Toggle between short and full hash display
   -Toggle between short and full hash display

2. **Visual Chain Representation**
   - Vertical timeline showing cryptographic chain
   - Color-coded action types with emojis
   - Visual linking between entries
   - Animated pulse indicators

3. **Hash Information**
   - Document SHA-256 hash display
   - Previous hash (link to prior entry)
   - Entry hash (current entry fingerprint)
   - Genesis block identification

4. **Chain Integrity Indicators**
   - Chain entry count
   - Validation status
   - Security level indicator (256-bit)
   - Real-time integrity status

5. **Entry Details**
   - Action type with color coding
   - Timestamp formatting
   - Actor identification
   - Metadata display (JSON)
   - Entry numbering

---

## Component API

### Props

```typescript
interface HashChainVisualizerProps {
    ledgerEntries: LedgerEntry[];  // Array of blockchain ledger entries
    documentHash: string;           // SHA-256 hash of the document
}
```

### LedgerEntry Structure

```typescript
interface LedgerEntry {
    id: number;
    document_id: number;
    action: string;              // ISSUED, VERIFIED, AMENDED, etc.
    actor_id: number | null;
    metadata: Record<string, any> | null;
    created_at: string;
    previous_hash: string | null;  // Link to previous entry
    entry_hash: string | null;     // Current entry hash
}
```

---

## Visual Design

### Action Color Coding

| Action | Color | Emoji | Meaning |
|--------|-------|-------|---------|
| ISSUED | Green | 📝 | Document first created |
| VERIFIED | Blue | ✅ | Hash integrity confirmed |
| AMENDED | Yellow | ✏️ | Document modified |
| SHIPPED | Purple | 🚢 | Trade shipment recorded |
| RECEIVED | Indigo | 📦 | Goods received |
| PAID | Lime | 💰 | Payment completed |
| CANCELLED | Red | ❌ | Transaction cancelled |

### Layout Sections

1. **Header Controls**
   - Title: "Blockchain Hash Chain"
   - Description: Purpose and security info
   - Toggle button: Switch hash display mode

2. **Document Hash Card**
   - Highlighted card with gradient background
   - Full SHA-256 hash display
   - Lock icon  and "Document Hash" label
   - Copy button

3. **Chain Integrity Stats** (3-column grid)
   - Chain Entries count
   - Validation status (Valid/Invalid)
   - Security level (256-bit)

4. **Ledger Entry Chain**
   - Vertical timeline with connecting line
   - Expandable entry cards
   - Hash preview (short format)
   - Full details on expansion

5. **Educational Info Box**
   - "How Hash Chain Works" explainer
   - Key principles of blockchain integrity

---

## User Interactions

### Click to Expand Entry

```
User clicks on a ledger entry card
  ↓
Card expands to show:
  - Full previous hash
  - Full entry hash
  - Complete metadata JSON
  - Actor information
  - Chain link indicator
```

### Copy Hash to Clipboard

```
User clicks 📋 copy icon next to hash
  ↓
Hash copied to clipboard (navigator.clipboard)
  ↓
User can paste for verification
```

### Toggle Hash Display Mode

```
User clicks "Show Full Hashes" button
  ↓
All hashes switch from short to full format
  - Short: 8 chars...8 chars
  - Full: Complete 64-character SHA-256 hash
```

---

## Technical Implementation

### Hash Formatting

```typescript
const formatHash = (hash: string | null, full: boolean = false): string => {
    if (!hash) return 'N/A';
    if (full || showFullHashes) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
};
```

### Copy to Clipboard

```typescript
const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};
```

### Expansion State Management

```typescript
const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

// Toggle on click
onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
```

---

## Blockchain Visualization

### Genesis Block

The first entry in the chain has:
- `previous_hash`: null
- Display: "🌱 Genesis"
- Meaning: Starting point of the chain

### Chain Linking

Each subsequent entry:
- Contains hash of previous entry in `previous_hash`
- Creates cryptographic link
- Makes tampering detectable

**Example Chain:**

```
Entry #1 (Genesis)
  previous_hash: null
  entry_hash: abc123def456...
         ↓
Entry #2 (VERIFIED)
  previous_hash: abc123def456...  ← Links to Entry #1
  entry_hash: def789ghi012...
         ↓
Entry #3 (SHIPPED)
  previous_hash: def789ghi012...  ← Links to Entry #2
  entry_hash: ghi345jkl678...
```

**Tampering Detection:**

If Entry #2 is modified:
- Its `entry_hash` changes
- Entry #3's `previous_hash` no longer matches
- Chain broken → tampering detected ✅

---

## Styling & Design System

### Color Palette

- **Primary**: Lime (`#84cc16`) - Valid/Active states
- **Background**: Dark (`#0a0a0a`) - Base color
- **Elevated**: Dark Elevated (`#1a1a1a`) - Cards
- **Secondary**: Gray (`#888`) - Supporting text
- **Border**: Border Dark (`#2a2a2a`) - Separators

### Animations

```css
/* Pulse animation for active chain link */
.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Gradient background */
bg-gradient-to-br from-lime/10 to-transparent
```

### Typography

- **Headers**: Poppins font family
- **Hashes**: Monospace font (`font-mono`)
- **Body**: Default system font

---

## Accessibility

- **Keyboard Navigation**: Clickable cards are keyboard accessible
- **Tooltips**: Full hashvalues shown on hover with `title` attribute
- **Color Contrast**: All text meets WCAG guidelines
- **Semantic HTML**: Proper heading hierarchy

---

## Usage Example

```tsx
import HashChainVisualizer from '../components/HashChainVisualizer';

function DocumentDetailsPage() {
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [document, setDocument] = useState<Document | null>(null);

    // ... fetch data ...

    return (
        <div>
            <HashChainVisualizer 
                ledgerEntries={ledgerEntries} 
                documentHash={document.hash} 
            />
        </div>
    );
}
```

---

## Benefits

### For Users

1. **Visual Understanding**: See exactly how blockchain integrity works
2. **Transparency**: Full access to all hash values
3. **Verification**: Copy hashes for external verification
4. **Education**: Built-in explainer of hash chain mechanics

### For Auditors

1. **Quick Verification**: Instantly see chain status
2. **Detail Access**: Expand to view full cryptographic proof
3. **Traceability**: Follow exact chain of events
4. **Tamper Detection**: Broken chain immediately visible

### For Developers

1. **Reusable Component**: Drop in anywhere ledger display is needed
2. **Type-Safe**: Full TypeScript typing
3. **Extensible**: Easy to add features
4. **Well-Documented**: Clear props and behavior

---

## Security Implications

### What This Proves

✅ **Document Authenticity**: Hash matches original file  
✅ **Chain Integrity**: Each entry cryptographically linked  
✅ **Tamper Evidence**: Any modification breaks the chain  
✅ **Timestamp Proof**: When each action occurred  
✅ **Actor Accountability**: Who performed each action

### What This Doesn't Prove

❌ **Real-world Identity**: Actor IDs could be compromised accounts  
❌ **Physical Reality**: Digital record ≠ physical world  
❌ **Legal Validity**: Depends on jurisdiction and regulations

---

## Performance Considerations

- **Rendering**: Efficient virtual DOM with React
- **State Management**: Minimal re-renders with targeted state updates
- **Large Chains**: Component handles 100+ entries smoothly
- **Memory**: Lazy expansion minimizes DOM nodes

---

## Future Enhancements

### Potential Features

1. **Search/Filter**: Find specific actions or actors
2. **Export**: Download hash chain as JSON/CSV
3. **Visual Graph**: Network diagram view of chain
4. **Real-time Updates**: WebSocket for live chain additions
5. **Hash Verification**: Upload file to verify against hash
6. **QR Codes**: Generate QR for hash sharing
7. **Print View**: Printer-friendly chain report
8. **Diff View**: Compare two chain states

---

## Testing Recommendations

### Unit Tests

- Test hash formatting (short/full)
- Test clipboard copy functionality
- Test expansion/collapse logic
- Test action color mapping

### Integration Tests

- Render with empty ledger entries
- Render with Genesis block only
- Render with full chain
- Test all action types display correctly

### E2E Tests

- Click to expand entry
- Toggle hash display mode
- Copy hash to clipboard
- Verify visual chain continuity

---

## Component File Structure

```
frontend/src/components/HashChainVisualizer.tsx
│
├── Imports
│   ├── useState from React
│   └── LedgerEntry type
│
├── Props Interface
│   ├── ledgerEntries: LedgerEntry[]
│   └── documentHash: string
│
├── State Management
│   ├── expandedEntry (number | null)
│   └── showFullHashes (boolean)
│
├── Helper Functions
│   ├── formatHash()
│   ├── copyToClipboard()
│   ├── getActionColor()
│   └── getActionIcon()
│
└── JSX Structure
    ├── Header Controls
    ├── Document Hash Card
    ├── Chain Integrity Stats
    ├── Ledger Entry Chain
    │   ├── Entry Card (repeating)
    │   │   ├── Entry Header
    │   │   ├── Hash Preview
    │   │   └── Expanded Details (conditional)
    │   └── Empty State
    └── Educational Info Box
```

---

## Related Documentation

- [Document Management Guide](DOCUMENT_MANAGEMENT.md)
- [Implementation Verification Report](IMPLEMENTATION_VERIFICATION.md)
- [Backend Ledger Service](../../backend/app/services/ledger_service.py)
- [Frontend Ledger Types](../frontend/src/types/ledger.types.ts)

---

**Component Version**: 1.0  
**Last Updated**: 2026-02-09  
**Status**: ✅ Production Ready
