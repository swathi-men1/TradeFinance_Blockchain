# Contributing to Trade Finance Blockchain Explorer

Thank you for your interest in contributing to our project! This guide will help you get started.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Standards](#code-standards)
4. [Testing Guidelines](#testing-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Bug Reports](#bug-reports)
7. [Feature Requests](#feature-requests)

---

## Getting Started

### Prerequisites
- **Git**: For version control
- **Docker**: For containerized development
- **Node.js 18+**: Frontend development
- **Python 3.11+**: Backend development
- **PostgreSQL 15+**: Local database (optional)

### Quick Start
```bash
# 1. Fork the repository
git clone https://github.com/yourusername/TradeFinance_Blockchain.git
cd TradeFinance_Blockchain

# 2. Add upstream remote
git remote add upstream https://github.com/original-org/TradeFinance_Blockchain.git

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Set up development environment
cp .env.example .env
# Edit .env with your local configuration
docker-compose up --build

# 5. Start development
# Frontend
cd frontend && npm run dev
# Backend (in separate terminal)
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
```

---

## Development Setup

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Required environment variables
DATABASE_URL=postgresql://localhost:5432/tradefinance
JWT_SECRET_KEY=your-secret-key
S3_ENDPOINT_URL=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=tradefinance-docs
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Format code
npm run format  # if configured
```

### Backend Development
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database Setup
```bash
# Start PostgreSQL with Docker
docker-compose up -d db

# Run migrations
docker-compose exec backend alembic upgrade head

# Create test data (optional)
docker-compose exec backend python scripts/create_test_data.py
```

---

## Code Standards

### Python Backend Standards

#### Code Style
- Follow **PEP 8** guidelines
- Use **4 spaces** for indentation (no tabs)
- Maximum line length: **88 characters**
- Use **type hints** for all function parameters and return values

#### Naming Conventions
```python
# Variables and functions: snake_case
user_profile = get_user_profile(user_id)
def calculate_risk_score(user_data: dict) -> float:

# Classes: PascalCase
class RiskScoreCalculator:
    def __init__(self):
        self.weights = RISK_WEIGHTS

# Constants: UPPER_SNAKE_CASE
MAX_RETRY_ATTEMPTS = 3
DEFAULT_PAGE_SIZE = 100
```

#### Documentation
```python
def complex_function(param1: str, param2: int) -> dict:
    """
    Calculate risk score based on user activity patterns.
    
    Args:
        param1: Description of first parameter
        param2: Description of second parameter
        
    Returns:
        Dictionary containing risk score and category
        
    Raises:
        ValueError: If parameters are invalid
    """
    # Implementation
    pass
```

#### Error Handling
```python
# Custom exceptions
class TradeFinanceError(Exception):
    """Base exception for trade finance operations"""
    pass

class InsufficientPermissionsError(TradeFinanceError):
    """Raised when user lacks required permissions"""
    pass

# Proper error handling
try:
    result = risky_operation(user_data)
except ValidationError as e:
    logger.error(f"Validation failed: {e}")
    raise
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise TradeFinanceError("Operation failed") from e
```

### TypeScript Frontend Standards

#### Code Style
- Use **TypeScript strict mode**
- Use **2 spaces** for indentation
- Maximum line length: **100 characters**
- Use **Prettier** for code formatting

#### Naming Conventions
```typescript
// Variables and functions: camelCase
const userProfile = getUserProfile(userId);
const calculateRiskScore = (userData: UserData) => number => {

// Components: PascalCase
export const AuditorDashboard: React.FC = () => {

// Interfaces: PascalCase with 'I' prefix
interface IUserProfile {
    id: number;
    name: string;
    email: string;
}

// Types: PascalCase
export type DocumentType = 'BILL_OF_LADING' | 'COMMERCIAL_INVOICE';
```

#### Component Structure
```typescript
// Functional components with hooks
import React, { useState, useEffect } from 'react';

interface ComponentProps {
    userId: number;
    onAction: (action: string) => void;
}

export const ComponentName: React.FC<ComponentProps> = ({ userId, onAction }) => {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        // Component logic
    }, [userId]);
    
    return (
        <div className="component-wrapper">
            {/* JSX content */}
        </div>
    );
};
```

#### State Management
```typescript
// Use React Context for global state
const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => {},
    logout: () => {},
});

// Custom hooks for complex state
const useDocumentManagement = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // State logic
    return { documents, loading, setDocuments, setLoading };
};
```

---

## Testing Guidelines

### Backend Testing

#### Test Structure
```
backend/tests/
├── unit/
│   ├── test_user_service.py
│   ├── test_risk_service.py
│   └── test_ledger_service.py
├── integration/
│   ├── test_api_endpoints.py
│   └── test_database_operations.py
├── fixtures/
│   ├── users.json
│   └── documents.json
└── conftest.py
```

#### Unit Tests
```python
import pytest
from app.services.user_service import UserService
from app.models.user import UserRole

class TestUserService:
    def test_create_user_success(self, db_session):
        """Test successful user creation"""
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "password123",
            "role": UserRole.CORPORATE
        }
        
        user = UserService.create_user(db_session, user_data)
        
        assert user.email == user_data["email"]
        assert user.role == user_data["role"]
        assert user.id is not None

    def test_create_user_duplicate_email(self, db_session):
        """Test duplicate email handling"""
        # Create first user
        user_data = {"email": "test@example.com", "name": "Test User"}
        UserService.create_user(db_session, user_data)
        
        # Attempt to create duplicate
        with pytest.raises(ValueError, match="Email already exists"):
            UserService.create_user(db_session, user_data)
```

#### Integration Tests
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

class TestAPIEndpoints:
    def test_document_upload_endpoint(self):
        """Test document upload API endpoint"""
        client = TestClient(app)
        
        # Test successful upload
        with open("test_document.pdf", "rb") as f:
            response = client.post(
                "/api/v1/documents/upload",
                files={"file": ("test.pdf", f, "application/pdf")},
                data={"document_data": '{"doc_type": "BILL_OF_LADING"}'}
            )
        
        assert response.status_code == 201
        assert "id" in response.json()

    def test_unauthorized_access(self):
        """Test unauthorized access handling"""
        client = TestClient(app)
        
        response = client.get("/api/v1/documents")
        assert response.status_code == 401
```

#### Running Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_user_service.py

# Run with verbose output
pytest -v

# Run tests matching pattern
pytest -k "test_create_user"
```

### Frontend Testing

#### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditorDashboard } from '../AuditorDashboard';

describe('AuditorDashboard', () => {
    test('renders dashboard title', () => {
        render(<AuditorDashboard />);
        expect(screen.getByText('Auditor Dashboard')).toBeInTheDocument();
    });

    test('displays compliance metrics', () => {
        render(<AuditorDashboard />);
        expect(screen.getByText('Total Documents')).toBeInTheDocument();
        expect(screen.getByText('Open Alerts')).toBeInTheDocument();
    });

    test('handles user interaction', async () => {
        render(<AuditorDashboard />);
        
        const verifyButton = screen.getByRole('button', { name: /verify document/i });
        fireEvent.click(verifyButton);
        
        expect(await screen.findByText('Verification completed')).toBeInTheDocument();
    });
});
```

#### E2E Testing
```typescript
import { test, expect } from '@playwright/test';

test.describe('Document Upload Flow', () => {
    test('user can upload document successfully', async ({ page }) => {
        await page.goto('/login');
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.fill('[data-testid="password"]', 'password123');
        await page.click('[data-testid="login-button"]');
        
        await page.goto('/documents/upload');
        await page.setInputFiles('[data-testid="file-input"]', 'test-document.pdf');
        await page.selectOption('[data-testid="doc-type"]', 'BILL_OF_LADING');
        await page.click('[data-testid="upload-button"]');
        
        await expect(page.locator('.success-message')).toBeVisible();
    });
});
```

#### Running Frontend Tests
```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- AuditorDashboard.test.tsx
```

---

## Pull Request Process

### Branch Strategy
```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Develop your feature
# Make changes following code standards

# 3. Commit your changes
git add .
git commit -m "feat: add document verification feature

- Implement SHA-256 integrity checking
- Add verification status tracking
- Update auditor dashboard"

# 4. Push to your fork
git push origin feature/your-feature-name
```

### Pull Request Guidelines

#### PR Title Format
```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Test additions
- chore: Maintenance tasks

Examples:
feat(auditor): add document verification system
fix(auth): resolve JWT token expiration issue
docs(api): update authentication documentation
```

#### PR Description Template
```markdown
## Description
Brief description of the changes and their purpose.

## Changes
- List of major changes with file references
- Include any breaking changes

## Testing
- How the changes were tested
- Test coverage information
- Manual testing steps

## Screenshots
- Before and after screenshots if applicable
- GIFs demonstrating new features

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of the code completed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Code Review Process
```bash
# 1. Automated checks run on PR
# - Linting
# - Type checking
# - Unit tests
# - Security scanning

# 2. Manual review checklist
# - Logic correctness
# - Performance implications
# - Security considerations
# - Documentation accuracy
# - Breaking changes identification
```

---

## Bug Reports

### Bug Report Template
```markdown
## Bug Description
Clear and concise description of the bug.

## Environment
- OS: [e.g., Ubuntu 20.04, macOS 12.0]
- Browser: [e.g., Chrome 120, Firefox 121]
- Version: [e.g., v1.2.0]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Fill in '...'
4. Press '...'
5. Observe error

## Expected Behavior
What should happen according to specifications.

## Actual Behavior
What actually happened (include error messages, screenshots).

## Possible Solution
If you have a suggestion for fixing the bug.

## Additional Context
Any other relevant information about the bug.
```

### Security Vulnerability Reports
For security vulnerabilities, please email directly to:
- **Email**: security@tradefinance-explorer.com
- **PGP Key**: Available on request

Do not open public issues for security vulnerabilities.

---

## Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature.

## Problem Statement
What problem does this feature solve?

## Proposed Solution
How do you envision this feature working?

## Alternatives Considered
What other approaches did you consider?

## Acceptance Criteria
- [ ] Criterion 1: Specific requirement
- [ ] Criterion 2: Specific requirement
- [ ] Criterion 3: Specific requirement

## Additional Notes
Any other relevant information.
```

---

## Development Tools

### Recommended IDE Setup
#### VS Code Extensions
- **Python**: Python, Pylance, Black Formatter
- **TypeScript**: TypeScript Importer, Prettier, ESLint
- **Docker**: Docker, Docker Compose
- **GitLens**: Git history and blame
- **Thunder Client**: API testing

#### Configuration Files
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit

# Setup .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 22.3.0
    hooks:
      - id: black
        language_version: python3.11
  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        args: ["--profile", "black"]
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

### Git Configuration
```bash
# .gitattributes
*.py text=auto diff=python
*.ts text=auto diff=typescript
*.tsx text=auto diff=typescript
*.json text=auto diff=json

# .gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm
.eslintcache

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Welcome new contributors
- Focus on what is best for the community
- Maintain professional communication

### Getting Help
- **Documentation**: Check `/docs` directory first
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers at support@tradefinance-explorer.com

### Recognition
Contributors will be recognized in:
- README.md contributor section
- Release notes for significant contributions
- Annual community summary (if applicable)

Thank you for contributing to the Trade Finance Blockchain Explorer! Your contributions help make this project better for everyone.
