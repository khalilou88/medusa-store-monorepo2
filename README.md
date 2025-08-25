# 🚀 Medusa Store Monorepo Guide (Git Subtree)

This guide explains how to set up a **production-ready npm workspace monorepo** with:

- **backend** → MedusaJS backend (as a git subtree from the `master` branch)
- **storefront** → Angular storefront (using CSS)
- **e2e** → Playwright end-to-end tests
- **Docker** → Containerized development environment
- **Shared tooling** → TypeScript, ESLint, Prettier configurations
- **CI/CD** → GitHub Actions pipeline

## 1. Create the workspace root

```bash
mkdir medusa-store-monorepo && cd medusa-store-monorepo
npm init -y
git init
```

## 2. Enable npm workspaces

Edit the **package.json** in the root:

```json
{
  "name": "medusa-store-monorepo",
  "private": true,
  "workspaces": ["backend", "storefront", "e2e"],
  "scripts": {
    "dev": "concurrently \"npm run start --workspace backend\" \"npm run start --workspace storefront\"",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "lint:fix": "npm run lint:fix --workspaces --if-present",
    "format": "prettier --write \"**/*.{js,ts,json,md,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{js,ts,json,md,yml,yaml}\"",
    "type-check": "npm run type-check --workspaces --if-present",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:build": "docker-compose build",
    "backend:update": "git subtree pull --prefix=backend --squash medusa-backend master",
    "backend:push": "git subtree push --prefix=backend medusa-backend master",
    "postinstall": "husky install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@eslint/js": "^9.17.0",
    "@typescript-eslint/eslint-plugin": "^8.18.2",
    "@typescript-eslint/parser": "^8.18.2",
    "eslint": "^9.17.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "prettier": "^3.2.5",
    "typescript": "^5.6.3",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.2",
    "globals": "^15.14.0",
    "typescript-eslint": "^8.18.2"
  }
}
```

## 3. Add the backend using git subtree

First, make an initial commit, then add the MedusaJS starter as a git subtree:

```bash
# Make initial commit (required before adding subtree)
git add .
git commit -m "chore: initial project setup"

# Add the remote repository
git remote add medusa-backend https://github.com/medusajs/medusa-starter-default.git

# Add the subtree (this will create the backend folder)
git subtree add --prefix=backend --squash medusa-backend master
```

**Note**: If the default branch is not `master`, check first:
```bash
git ls-remote --heads https://github.com/medusajs/medusa-starter-default.git
```

## 4. Create shared TypeScript configuration

Create **tsconfig.json** in the root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@backend/*": ["backend/src/*"],
      "@storefront/*": ["storefront/src/*"],
      "@e2e/*": ["e2e/src/*"]
    }
  },
  "exclude": ["node_modules", "**/node_modules", "dist", "**/dist"]
}
```

## 5. Create shared ESLint configuration

Create **eslint.config.js** in the root (ESLint 9 uses flat config):

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default tseslint.config(
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  
  // Global settings
  {
    plugins: {
      prettier: prettierPlugin,
    },
    
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  
  // Storefront-specific configuration
  {
    files: ['storefront/**/*'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  
  // E2E-specific configuration
  {
    files: ['e2e/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/',
      '**/node_modules/',
      'dist/',
      '**/dist/',
      'build/',
      '**/build/',
      'coverage/',
      '**/coverage/',
      '.next/',
      '.nuxt/',
      '*.min.js',
      '*.min.css',
    ],
  }
);
```

## 6. Create Prettier configuration

Create **.prettierrc.json**:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular"
      }
    }
  ]
}
```

Create **.prettierignore**:

```
node_modules/
dist/
build/
coverage/
.next/
.nuxt/
*.min.js
*.min.css
package-lock.json
yarn.lock
backend
```

## 7. Set up Git hooks with Husky

```bash
npm install
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

Create **.lintstagedrc.json**:

```json
{
  "*.{js,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

## 8. Create Docker development environment

Create **compose.yml**:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: medusa-postgres
    environment:
      POSTGRES_USER: medusa
      POSTGRES_PASSWORD: medusa
      POSTGRES_DB: medusa_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - medusa-network

  redis:
    image: redis:7-alpine
    container_name: medusa-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    networks:
      - medusa-network

  minio:
    image: minio/minio:latest
    container_name: medusa-minio
    ports:
      - '9000:9000'
      - '9001:9001'
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    networks:
      - medusa-network

volumes:
  postgres_data:
  redis_data:
  minio_data:

networks:
  medusa-network:
    driver: bridge
```

Create **Dockerfile.backend** (for production builds):

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy application code
COPY backend/ ./

# Build the application
RUN npm run build

EXPOSE 9000

CMD ["npm", "start"]
```

## 9. Create environment configuration

Create **.env.example**:

```bash
# Database
DATABASE_URL=postgresql://medusa:medusa@localhost:5432/medusa_db

# Redis
REDIS_URL=redis://localhost:6379

# Backend
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_URL=http://localhost:7001

# Storefront
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000

# MinIO (S3-compatible storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=medusa-bucket

# JWT
JWT_SECRET=your-jwt-secret-here
COOKIE_SECRET=your-cookie-secret-here

# Admin
MEDUSA_ADMIN_ONBOARDING_TYPE=default
```

## 10. Create the Angular storefront

```bash
npx @angular/cli new storefront --style=css --routing=true --package-manager=npm
```

Update **storefront/package.json** to include linting scripts:

```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit"
  }
}
```

## 11. Create the E2E test project with Playwright

```bash
mkdir e2e && cd e2e
npm init -y
npm install -D @playwright/test typescript @types/node
npx playwright install
cd ..
```

Update **e2e/package.json**:

```json
{
  "name": "e2e",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report",
    "lint": "eslint . --ext .ts --fix",
    "lint:fix": "eslint . --ext .ts --fix",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.0",
    "@types/node": "^22.10.2",
    "typescript": "^5.6.3"
  }
}
```

Create **e2e/playwright.config.ts**:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start --workspace backend',
      port: 9000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run start --workspace storefront',
      port: 4200,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

Create **e2e/tests/example.spec.ts**:

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Angular/);
});

test('can navigate to products', async ({ page }) => {
  await page.goto('/');
  // Add your specific navigation tests here
});
```

## 12. Create GitHub Actions CI/CD pipeline

Create **.github/workflows/ci.yml**:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check formatting
        run: npm run format:check

      - name: Run linting
        run: npm run lint

      - name: Type checking
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: medusa
          POSTGRES_PASSWORD: medusa
          POSTGRES_DB: medusa_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build applications
        run: npm run build

      - name: Run unit tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test --workspace e2e
        env:
          DATABASE_URL: postgresql://medusa:medusa@localhost:5432/medusa_db
          REDIS_URL: redis://localhost:6379

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 30

  build-and-deploy:
    if: github.ref == 'refs/heads/main'
    needs: [lint-and-format, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build applications
        run: npm run build

      - name: Build Docker images
        run: |
          docker build -f Dockerfile.backend -t medusa-backend:latest .
          docker build -f storefront/Dockerfile -t medusa-storefront:latest ./storefront

      # Add deployment steps here (Docker registry, cloud provider, etc.)
```

## 13. Create comprehensive .gitignore

Create **.gitignore**:

```
# Dependencies
node_modules/
*/node_modules/

# Production builds
dist/
build/
.next/
.nuxt/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Test reports
test-results/
playwright-report/
blob-report/

# Docker
.dockerignore

# Database
*.sqlite
*.db
```

## 14. Connect to GitHub and initial setup

1. Create a new GitHub repo: https://github.com/new → name it `medusa-store-monorepo` (leave empty).

2. Link your local project:

```bash
git remote add origin git@github.com:<your-username>/medusa-store-monorepo.git
```

3. Set up environment:

```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Start development services:

```bash
npm run docker:up
npm install
```

5. Initial commit and push:

```bash
git add .
git commit -m "feat: initial monorepo setup with tooling

- Add MedusaJS backend as git subtree
- Add Angular storefront with CSS
- Add Playwright e2e testing
- Add Docker development environment
- Add shared TypeScript/ESLint/Prettier configuration
- Add GitHub Actions CI/CD pipeline
- Add comprehensive tooling and scripts"

git branch -M main
git push -u origin main
```

## 15. Development workflow commands

### Daily development

```bash
# Start all services
npm run docker:up
npm run dev

# Run tests
npm run test
npm run test --workspace e2e

# Code quality
npm run lint
npm run format
npm run type-check
```

### Backend subtree management

**Update backend from upstream:**
```bash
npm run backend:update
# or manually:
git subtree pull --prefix=backend --squash medusa-backend master
```

**Push backend changes upstream (if you have write access):**
```bash
npm run backend:push
# or manually:
git subtree push --prefix=backend medusa-backend master
```

**Make local changes to backend:**
```bash
# Make changes in backend/ folder
git add backend/
git commit -m "feat: update backend configuration"
git push origin main
```

### Team onboarding

New developers should run:

```bash
git clone <repo-url>
cp .env.example .env
# Edit .env with local values
npm install
npm run docker:up
npm run dev
```

## ✅ Git Subtree vs Submodule Benefits

**Git Subtree advantages:**
- **Simpler for team members** - no special clone commands needed
- **Self-contained** - all code is in the main repository
- **Better CI/CD** - no submodule initialization required
- **Easier branching** - subtree content moves with branches
- **No broken references** - subtree commits are part of main repo history

**Workflow differences:**
- **Submodule**: `git clone --recurse-submodules`
- **Subtree**: `git clone` (normal clone works)

**Updates:**
- **Submodule**: Update pointer to new commit
- **Subtree**: Merge/squash latest changes into main repo

## ✅ ESLint 9 Migration Benefits

**New features in ESLint 9:**
- **Flat Config** - Simpler, more intuitive configuration with `eslint.config.js`
- **Better TypeScript integration** - Improved performance and type checking
- **Module-based plugins** - Cleaner plugin architecture
- **Improved performance** - Faster linting and better caching
- **Future-proof** - ESLint 9 is the current major version with active support

**Configuration differences:**
- **Old**: `.eslintrc.json` with extends/overrides pattern
- **New**: `eslint.config.js` with flat configuration arrays
- **Plugins**: Import-based instead of string-based plugin references
- **Globals**: Explicit global definitions using the `globals` package

## ✅ Final Enhanced Project Structure

```
medusa-store-monorepo/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── backend/              (git subtree)
├── storefront/           (Angular app)
├── e2e/                  (Playwright tests)
├── docker-compose.yml
├── Dockerfile.backend
├── .env.example
├── .gitignore
├── eslint.config.js      (ESLint 9 flat config)
├── .prettierrc.json
├── .prettierignore
├── .lintstagedrc.json
├── tsconfig.json
└── package.json          (workspace config)
```

This enhanced setup provides:

- **Containerized development** with PostgreSQL, Redis, and MinIO
- **Shared tooling** for consistent code quality
- **Automated testing** and CI/CD pipeline
- **Git hooks** for pre-commit quality checks
- **Production-ready** Docker configurations
- **Team collaboration** tools and workflows
- **Simplified git subtree management** for easier team workflows