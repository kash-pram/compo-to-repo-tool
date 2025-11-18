
## 🔧 Configuration Guide

### Essential Configuration

#### 1. Set Your GitHub Username

**File:** `deploy-config.json`
```json
{
  "githubUsername": "your-github-username"  // ⚠️ REQUIRED
}
```

#### 2. Choose Default Visibility

```json
{
  "defaultVisibility": "public"  // or "private"
}
```

### Advanced Configuration

#### Custom Base Files

Add files that should be included in every deployment:

```json
{
  "baseFiles": [
    "package.json",
    "angular.json",
    "tsconfig.json",
    "your-custom-file.ts"  // Add custom files here
  ]
}
```

#### Always-Include Folders

Folders automatically copied to every deployment:

```json
{
  "alwaysIncludeFolders": [
    "src/app/services",      // Shared services
    "src/app/models",        // Data models
    "src/app/shared",        // Utilities
    "src/app/guards"         // Add custom folders
  ]
}
```

#### Component-Specific Dependencies

**File:** `src/app/components/my-component/dependencies.json`

```json
{
  "component": "my-component",
  "description": "My awesome component",
  "dependencies": {
    "services": [
      "src/app/services/api.service.ts"
    ],
    "components": [
      "src/app/components/shared-button"
    ],
    "models": [
      "src/app/models/user.model.ts"
    ],
    "sharedModules": [
      "src/app/shared/validators.ts"
    ],
    "assets": [
      "src/assets/images/logo.png",
      "src/assets/fonts/"
    ],
    "environments": true
  }
}
```

---


### `deploy-config.json` Structure
```json
{
  "baseFiles": [
    // Angular config files to copy
    "angular.json",
    "tsconfig.json",
    ...
  ],
  "githubUsername": "your-username",        // Your GitHub username
  "defaultVisibility": "public",            // Default repo visibility
  "alwaysIncludeFolders": [
    // Folders always copied (if they exist)
    "src/app/services",
    "src/app/models",
    "src/environments"
  ],
  "alwaysIncludeFiles": [
    // Files always copied (if they exist)
    "src/environments/environment.ts"
  ],
  "githubPages": {
    "enabled": true,              // Enable GitHub Pages setup
    "createWorkflow": true,       // Create GitHub Actions workflow
    "create404": true             // Create 404.html for routing
  }
}
```

### Customizing Included Files

**Add more folders to always include:**
```json
"alwaysIncludeFolders": [
  "src/app/services",
  "src/app/pipes",              // Add custom pipes
  "src/app/directives"          // Add custom directives
]
```

**Add specific files:**
```json
"alwaysIncludeFiles": [
  "src/environments/environment.ts",
  "src/assets/config.json"      // Add config files
]
```

---

## 📁 File Structure

### Tool Files
```
deploy-component.js       # Main deployment script
deploy-config.json        # Configuration file
```

### Component Structure (Your Project)
```
src/app/components/
└── word-cloud/
    ├── word-cloud.ts      # Component logic
    ├── word-cloud.html    # Template (or inline)
    ├── word-cloud.css     # Styles (or inline)
    └── README.md          # Optional: Will be used as repo README
```

### Generated Repository Structure
```
new-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── app/
│   │   ├── word-cloud/
│   │   ├── app.ts
│   │   └── app.config.ts
│   ├── index.html
│   └── 404.html
├── package.json
├── package-lock.json
├── angular.json
├── tsconfig.json
└── README.md
```




### Root Level
```
compo-to-repo-tool/
├── 📜 README.md                    ← You are here
├── ⚙️ angular.json                  ← Angular configuration
├── 📦 package.json                  ← All possible dependencies
├── 🔧 tsconfig.json                 ← TypeScript config
├── 🚀 deploy-component.js           ← Deployment automation script
├── ⚙️ deploy-config.json            ← Your configuration
└── 📁 .github/workflows/            ← GitHub Pages automation
```

### Source Structure
```
src/
├── 📁 app/
│   ├── 📁 components/               ← ⭐ Your components go here
│   │   ├── word-cloud/
│   │   ├── data-table/
│   │   └── chart-widget/
│   │
│   ├── 📁 services/                 ← Shared services (auto-detected)
│   │   ├── api.service.ts
│   │   └── data.service.ts
│   │
│   ├── 📁 models/                   ← Data models (auto-detected)
│   │   └── app.model.ts
│   │
│   ├── 📁 shared/                   ← Utilities (auto-detected)
│   │   └── utils.ts
│   │
│   ├── app.component.ts             ← Root component
│   ├── app.config.ts                ← App configuration
│   └── app.routes.ts                ← Routing
│
├── main.ts                          ← Bootstrap file
├── index.html                       ← HTML entry point
└── styles.css                       ← Global styles
```



## 📁 Project Structure Explained

### Configuration Files

#### `deploy-config.json`
```json
{
  "githubUsername": "your-username",      // ⚠️ Change this!
  "defaultVisibility": "public",          // public or private
  "baseFiles": [...],                     // Core Angular files
  "alwaysIncludeFolders": [...],          // Auto-copied folders
  "alwaysIncludeFiles": [...]             // Auto-copied files
}
```

#### Component Structure
```
src/app/components/my-component/
├── my-component.component.ts           ← Component logic
├── my-component.component.html         ← Template
├── my-component.component.css          ← Styles
├── README.md                           ← Component docs (optional)
└── dependencies.json                   ← Manual deps (optional)
```


This isn't a typical Angular project—it's specifically architected as a **component incubator**:

```
compo-to-repo-tool/
│
├── 🎯 Component Development Zone
│   └── src/app/components/        ← Drop AI-generated components here
│       ├── word-cloud/
│       ├── data-table/
│       └── chart-widget/
│
├── 🔧 Shared Infrastructure (automatically detected)
│   ├── src/app/services/          ← Shared services
│   ├── src/app/models/            ← Data models
│   └── src/app/shared/            ← Utilities
│
├── 🚀 Deployment Engine
│   ├── deploy-component.js        ← Main automation script
│   ├── deploy-config.json         ← Configuration
│   └── .github/workflows/         ← GitHub Pages automation
│
└── 📚 Base Angular Foundation
    ├── angular.json               ← Pre-configured for deployment
    ├── package.json               ← All possible dependencies
    └── tsconfig.json              ← TypeScript configuration
```

### Why This Structure Works

1. **Isolation**: Each component lives in its own folder
2. **Reusability**: Shared services/models are auto-detected
3. **Flexibility**: Add any component without breaking others
4. **Portability**: Each component can be extracted independently

---

## 🎨 Customization

### Change Component Destination Path

By default, components are copied from `src/app/components/NAME` to `src/app/NAME`.

**To keep the components folder:**

Edit `deploy-component.js`, find this line:
```javascript
const componentDest = path.join(tempDir, 'src', 'app', componentName);
```

Change to:
```javascript
const componentDest = path.join(tempDir, 'src', 'app', 'components', componentName);
```

### Disable Auto-Enable of GitHub Pages

If you prefer to manually enable Pages every time:

Edit `deploy-config.json`:
```json
"githubPages": {
  "enabled": false  // Disable automatic setup
}
```

### Change Workflow Timeout

Default: 5 minutes (20 attempts × 15 seconds)

Edit `deploy-component.js`:
```javascript
const maxAttempts = 20; // Change to 40 for 10 minutes
```

### Add Custom Files to Deployment

Edit `deploy-config.json`:
```json
"alwaysIncludeFiles": [
  "src/environments/environment.ts",
  "src/assets/logo.png",          // Add custom files
  "src/styles/theme.scss"
]
```

### Change Default Repository Visibility

Edit `deploy-config.json`:
```json
"defaultVisibility": "private"  // or "public"
```

---

## 📚 Complete Usage Guide

### Basic Deployment

```bash
npm run deploy-component
```

**Prompts:**
```
📦 Component name: my-component
📝 Repository name: my-component-demo
🔒 Visibility [public]: public
📄 Description: Interactive component demo
```

### Deploy Multiple Components

```bash
# Component 1
npm run deploy-component
# Enter: word-cloud, word-cloud-demo

# Component 2
npm run deploy-component
# Enter: data-table, table-component

# Component 3
npm run deploy-component
# Enter: chart-widget, charts-demo
```

Each gets its own repository and live demo!

### With Component README

Create a README for better documentation:

**File:** `src/app/components/my-component/README.md`
```markdown
# My Component

Interactive 3D visualization component.

## Features
- Real-time updates
- Touch gestures
- Responsive design

## Installation
\`\`\`bash
npm install
npm install three
\`\`\`

## Usage
\`\`\`typescript
import { MyComponent } from './my-component';
\`\`\`
```

This README will be used in the deployed repository.


---

## 🎓 Advanced Topics

### Custom Deployment Script

Modify `deploy-component.js` for your needs:

```javascript
// Example: Add custom validation
function validateComponent(componentName) {
  // Your custom logic
  if (!componentName.includes('-')) {
    throw new Error('Component names must use kebab-case');
  }
}

// Example: Custom post-deployment action
async function postDeploy(repoUrl) {
  console.log('🎉 Deployed to:', repoUrl);
  // Send notification, update database, etc.
}
```

### Batch Deployment

Deploy multiple components at once:

**File:** `batch-deploy.sh`
```bash
#!/bin/bash

components=("word-cloud" "data-table" "chart-widget")

for component in "${components[@]}"; do
  echo "$component
${component}-demo
public
Demo of $component" | npm run deploy-component
done
```

### CI/CD Integration

Automate deployments with GitHub Actions:

**File:** `.github/workflows/auto-deploy.yml`
```yaml
name: Auto Deploy Component

on:
  push:
    paths:
      - 'src/app/components/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run deploy-component
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Custom GitHub Pages Theme

Add custom styling to deployed components:

**File:** `src/app/components/my-component/styles-override.css`
```css
/* Add to component for GitHub Pages */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}
```

---

## 📊 What Gets Deployed

### Included in Every Deployment

✅ **Core Angular Files**
- `package.json` (filtered)
- `angular.json`
- `tsconfig.json`
- All TypeScript configs

✅ **Base Application**
- `src/main.ts`
- `src/index.html`
- `src/styles.css`
- `src/app/app.component.*`
- `src/app/app.config.ts`
- `src/app/app.routes.ts`

✅ **Your Component**
- All files from `src/app/components/[name]/`
- Moved to `src/app/[name]/`

✅ **Auto-Detected Dependencies**
- Services from `src/app/services/`
- Models from `src/app/models/`
- Shared modules from `src/app/shared/`
- Assets referenced in code

✅ **Environment Files**
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

✅ **README**
- Component-specific README if exists
- Auto-generated README otherwise

✅ **GitHub Pages Configuration**
- Workflow file for automatic deployment
- gh-pages branch setup

### NOT Included

❌ Other components in `src/app/components/`  
❌ Unused npm packages  
❌ Development-only dependencies  
❌ `.git` folder  
❌ `node_modules/`  
❌ Test files (optional)

---

## 🎯 How the Automation Works

### The Intelligence Behind the Magic

#### 1. **Component Analysis Phase**
```javascript
🔍 Scanning component files...
├── Reading TypeScript imports
├── Detecting npm packages (three, lodash, etc.)
├── Finding service dependencies
├── Locating model files
└── Identifying shared modules

✓ Analysis complete: 8 dependencies found
```

#### 2. **Repository Creation Phase**
```javascript
📦 Creating GitHub repository...
├── Calling GitHub API via CLI
├── Setting repository visibility
├── Adding description
└── Initializing with branch: main

✓ Repository: https://github.com/user/component-name
```

#### 3. **Smart Packaging Phase**
```javascript
📋 Copying base Angular files...
├── angular.json
├── tsconfig.json
├── package.json (filtering in progress...)
└── Core app files

📦 Copying component...
├── Moving from: src/app/components/my-component/
└── Moving to: src/app/my-component/

🔗 Copying dependencies...
├── services/data.service.ts
├── models/app.model.ts
└── shared/utils.ts
```

#### 4. **Package Filtering Phase**
```javascript
📦 Filtering package.json...

Original: 127 packages
├── Removing unused: 89 packages
├── Keeping core Angular: 18 packages
├── Keeping component deps: 12 packages
└── Keeping dev tools: 8 packages

Final: 38 packages (-70% size!)
```

#### 5. **Import Path Update Phase**
```javascript
🔧 Updating import paths...

Finding: import { X } from './components/my-component'
Replacing: import { X } from './my-component'

✓ Updated 12 files
```

#### 6. **GitHub Pages Deployment Phase**
```javascript
🌐 Deploying to GitHub Pages...
├── Building production bundle
├── Pushing to gh-pages branch
├── Configuring GitHub Pages settings
└── Waiting for deployment...

✓ Live at: https://user.github.io/component-name/
```

---