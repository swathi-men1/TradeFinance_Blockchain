<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->

# Contributor Handbook

> Guidelines for contributing to the Trade Finance Blockchain Explorer platform.

---

## Code Standards

### TypeScript / React
- Strict TypeScript mode enabled
- Functional components with hooks
- Service layer pattern for API interactions
- CSS custom properties for theme-aware styling
- All source files include the FRS attribution header

### Python / FastAPI
- Type hints on all function signatures
- Pydantic schemas for request/response validation
- Service layer pattern for business logic
- SQLAlchemy 2.0 style queries

---

## File Header Convention

Every source file includes the following attribution:

```typescript
/**
 * Functional Requirements Specification (FRS)
 * Project: Trade Finance Blockchain Explorer
 * Developer: Abdul Samad
 */
```

For markdown files:
```html
<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->
```

---

## Component Naming Convention

| Pattern | Example |
|---------|---------|
| Page components | `DashboardPage`, `CertificateDetailsPage` |
| UI components | `ElevatedPanel`, `MetricTile`, `ThreatIndicator` |
| Service modules | `documentService`, `tradeService` |
| Type definitions | `document.types.ts`, `trade.types.ts` |
| Context providers | `AuthContext`, `ThemeContext` |

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready releases |
| `develop` | Integration branch |
| `feature/*` | New feature development |
| `fix/*` | Bug fixes |

---

## Development Workflow

1. Create a feature branch from `develop`
2. Implement changes following coding standards
3. Ensure `npm run build` passes with zero errors
4. Submit pull request with descriptive title and summary
5. Address review feedback
6. Merge upon approval

---

**Developer**: Abdul Samad
