# Angular Component Deployment Automation

Automate the deployment of individual Angular components to separate GitHub repositories with all their dependencies, filtered package.json, and updated import paths.

## Features

✅ **Automatic GitHub Repository Creation** - Creates new repositories via GitHub CLI  
✅ **Smart Dependency Detection** - Auto-detects services, models, components, and shared modules from imports  
✅ **Filtered package.json** - Includes only necessary npm packages for the component  
✅ **Import Path Updates** - Automatically adjusts import paths from `components/[name]` to `[name]`  
✅ **Component-Specific README** - Uses component README or generates default  
✅ **Zero Manual Work** - Single command deployment with interactive prompts  

---

## Prerequisites

### 1. Node.js
- Node.js 16+ installed

### 2. GitHub CLI
Install GitHub CLI:

**Windows:**
```bash
winget install --id GitHub.cli
```

**Mac:**
```bash
brew install gh
```

**Linux:**
```bash
sudo apt install gh
```

**Authenticate:**
```bash
gh auth login
```

### 3. Git
- Git must be installed and configured

---

## Installation

### 1. Add Files to Your Angular Project

Place these files in your project root:
- `deploy-component.js`
- `deploy-config.json`

### 2. Configure `deploy-config.json`

```json
{
  "baseFiles": [
    "package.json",
    "angular.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.spec.json",
    ".gitignore",
    "src/main.ts",
    "src/index.html",
    "src/styles.css",
    "src/app/app.component.ts",
    "src/app/app.component.html",
    "src/app/app.component.css",
    "src/app/app.config.ts",
    "src/app/app.routes.ts"
  ],
  "githubUsername": "your-github-username",
  "defaultVisibility": "public",
  "alwaysIncludeFolders": [
    "src/app/services",
    "src/app/models",
    "src/app/shared",
    "src/environments"
  ],
  "alwaysIncludeFiles": [
    "src/environments/environment.ts",
    "src/environments/environment.prod.ts"
  ]
}
```

**Important:** Replace `"your-github-username"` with your actual GitHub username.

### 3. Add NPM Script to `package.json`

```json
{
  "scripts": {
    "deploy-component": "node deploy-component.js"
  }
}
```

---

## Project Structure

Your Angular project should follow this structure:

```
your-angular-project/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── my-component/
│   │   │   │   ├── my-component.component.ts
│   │   │   │   ├── my-component.component.html
│   │   │   │   ├── my-component.component.css
│   │   │   │   ├── README.md              (optional)
│   │   │   │   └── dependencies.json      (optional)
│   │   │   └── another-component/
│   │   ├── services/
│   │   │   ├── data.service.ts
│   │   │   └── api.service.ts
│   │   ├── models/
│   │   │   └── app.model.ts
│   │   ├── shared/
│   │   │   └── utils.ts
│   │   └── app.component.ts
│   └── ...
├── deploy-config.json
├── deploy-component.js
└── package.json
```

---

## Usage

### Basic Deployment

Run the deployment command:

```bash
npm run deploy-component
```

### Interactive Prompts

```
📦 Component name (e.g., my-component): [enter-component-name]
📝 New repository name: [enter-repo-name]
🔒 Repository visibility (public/private) [public]: [public/private]
📄 Repository description (optional): [enter-description]
```

### What Happens

1. ✅ Analyzes component dependencies
2. ✅ Creates GitHub repository
3. ✅ Copies base Angular files
4. ✅ Copies component from `src/app/components/[name]/`
5. ✅ Places component in `src/app/[name]/` in repository
6. ✅ Copies all detected dependencies
7. ✅ Updates all import paths
8. ✅ Filters package.json
9. ✅ Adds README
10. ✅ Pushes to GitHub

---

## Dependency Management

### Automatic Detection

The script automatically detects:
- **Services** - From `src/app/services/`
- **Models** - From `src/app/models/`
- **Shared Modules** - From `src/app/shared/`
- **Other Components** - From `src/app/components/`
- **NPM Packages** - From import statements

### Manual Dependencies (Optional)

Create `dependencies.json` in your component folder:

**File:** `src/app/components/[component-name]/dependencies.json`

```json
{
  "component": "component-name",
  "description": "Component description",
  "dependencies": {
    "services": [
      "src/app/services/data.service.ts",
      "src/app/services/api.service.ts"
    ],
    "components": [
      "src/app/components/shared-component"
    ],
    "models": [
      "src/app/models/app.model.ts"
    ],
    "sharedModules": [
      "src/app/shared/utils.ts"
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

## Package.json Filtering

### What Gets Included

**Always Included:**
- Core Angular packages (`@angular/core`, `@angular/common`, etc.)
- All Angular build tools (`@angular-devkit/*`, `@angular/build`, `@angular/cli`)
- TypeScript and essential dev dependencies
- Testing packages (Karma, Jasmine)

**Component-Specific:**
- Only npm packages imported by the component
- Type definitions (`@types/*`) for used packages

### Example

**Original package.json (100+ packages):**
```json
{
  "dependencies": {
    "@angular/core": "^18.0.0",
    "package-a": "^1.0.0",
    "package-b": "^2.0.0",
    "package-c": "^3.0.0",
    "rxjs": "^7.8.0"
  }
}
```

**Filtered package.json (only what's needed):**
```json
{
  "dependencies": {
    "@angular/core": "^18.0.0",
    "package-a": "^1.0.0",
    "rxjs": "^7.8.0"
  }
}
```

---

## Component README

### Option 1: Component-Specific README

Create `README.md` in your component folder:

**File:** `src/app/components/[component-name]/README.md`

```markdown
# Component Name

Brief description of your component.

## Features
- Feature 1
- Feature 2
- Feature 3

## Installation
\`\`\`bash
npm install
npm install [any-specific-packages]
\`\`\`

## Usage
\`\`\`bash
ng serve
\`\`\`

## Configuration
Describe any configuration needed.
```

This README will be used at the repository root level (not inside the component folder).

### Option 2: Auto-Generated README

If no component README exists, a default README is generated automatically.

---

## Import Path Updates

The script automatically updates import paths:

**Before (in your local project):**
```typescript
import { MyComponent } from './components/my-component/my-component.component';
import { DataService } from '../components/my-component/services/data.service';
```

**After (in deployed repository):**
```typescript
import { MyComponent } from './my-component/my-component.component';
import { DataService } from '../my-component/services/data.service';
```

All references to `components/[component-name]` are updated to just `[component-name]`.

---

## Repository Structure

### Your Local Project
```
src/app/
├── components/
│   └── my-component/
│       ├── my-component.component.ts
│       └── ...
├── services/
└── models/
```

### Deployed Repository
```
src/app/
├── my-component/            ← Moved from components/
│   ├── my-component.component.ts
│   └── ...
├── services/                ← Copied dependencies
└── models/                  ← Copied dependencies
```

---

## Troubleshooting

### Error: `gh: command not found`

**Solution:** Install GitHub CLI and authenticate:
```bash
# Install
winget install GitHub.cli  # Windows
brew install gh            # Mac

# Authenticate
gh auth login
```

### Error: `Component not found`

**Solution:** Ensure your component is in `src/app/components/[component-name]/`

Check available components:
```
Available components:
   component-a, component-b, component-c
```

### Error: `ng serve` fails in deployed repo

**Solution:** The script includes all necessary Angular build tools. If issue persists:
```bash
cd deployed-repo
npm install
ng serve
```

### Error: `Could not find the '@angular/build:dev-server' builder's node package`

**Solution:** This happens if Angular build packages are missing. The script now automatically includes:
- `@angular-devkit/build-angular`
- `@angular/build`
- `@angular/cli`
- All `@angular-devkit/*` packages

Re-run the deployment script with the updated version.

### Component appears but imports fail

**Solution:** Check if dependencies were detected. Add `dependencies.json` for manual specification.

### Import paths not working

**Solution:** Verify the import path update worked:
1. Check if paths changed from `components/[name]` to `[name]`
2. Ensure relative paths are correct (`./` vs `../`)

---

## Configuration Options

### Always Include Folders

Folders copied to every deployment (modify in `deploy-config.json`):

```json
"alwaysIncludeFolders": [
  "src/app/services",
  "src/app/models",
  "src/app/shared",
  "src/environments"
]
```

### Always Include Files

Individual files copied to every deployment:

```json
"alwaysIncludeFiles": [
  "src/environments/environment.ts",
  "src/environments/environment.prod.ts"
]
```

### Base Files

Core Angular files included in every deployment:

```json
"baseFiles": [
  "package.json",
  "angular.json",
  "tsconfig.json",
  "src/main.ts",
  "src/index.html",
  "src/styles.css",
  "src/app/app.component.ts"
]
```

Add or remove files based on your project structure.

---

## Workflow Examples

### Example 1: Simple Component Deployment

```bash
npm run deploy-component

📦 Component name: button-component
📝 Repository name: custom-button
🔒 Visibility: public
📄 Description: Reusable button component

✓ Repository created: https://github.com/username/custom-button
✓ Component copied
✓ 2 dependencies detected
✓ package.json filtered (12 packages)
✓ Pushed to GitHub

🎉 SUCCESS!
```

### Example 2: Component with Dependencies

```bash
npm run deploy-component

📦 Component name: dashboard
📝 Repository name: analytics-dashboard
🔒 Visibility: private
📄 Description: Analytics dashboard

✓ Found dependencies.json
✓ Repository created
✓ Component copied
✓ 8 dependencies detected:
  - 2 services
  - 1 model
  - 1 shared module
  - 4 npm packages
✓ Import paths updated
✓ Pushed to GitHub

🎉 SUCCESS!
```

### Example 3: Component with Assets

```bash
npm run deploy-component

📦 Component name: logo-display
📝 Repository name: company-logo
🔒 Visibility: public
📄 Description: Company logo component

✓ Component copied
✓ 1 dependency detected:
  - src/assets/images/logo.png
✓ Pushed to GitHub

🎉 SUCCESS!
```

---

## Advanced Usage

### Custom Dependency Detection

The script scans TypeScript files for:
- `import { ... } from './path'` - Relative imports
- `import { ... } from '@angular/...'` - Angular packages
- `import * as Package from 'package'` - NPM packages

### Multiple Components

Deploy multiple components separately:

```bash
# Deploy component 1
npm run deploy-component
# Enter: header-component, header-repo

# Deploy component 2
npm run deploy-component
# Enter: footer-component, footer-repo

# Deploy component 3
npm run deploy-component
# Enter: sidebar-component, sidebar-repo
```

Each component gets its own repository with its specific dependencies.

---

## Best Practices

### 1. Component Isolation
- Keep components self-contained in `src/app/components/`
- Minimize dependencies on other components
- Use services for shared logic

### 2. README Files
- Always create component-specific README.md
- Document installation steps
- Include usage examples
- List any special requirements

### 3. Dependencies File
- Use `dependencies.json` for complex dependencies
- Explicitly list assets needed
- Document why each dependency is required

### 4. Testing Before Deployment
- Test component locally first
- Verify all imports work
- Check that services/models are accessible

### 5. Repository Naming
- Use descriptive repository names
- Follow naming conventions: `kebab-case`
- Include project context if needed

---

## Security Considerations

### GitHub Authentication
- GitHub CLI handles authentication securely
- Tokens are stored by GitHub CLI, not the script
- Use `gh auth status` to verify authentication

### Repository Visibility
- Choose `public` for open-source components
- Choose `private` for proprietary code
- Default is configurable in `deploy-config.json`

### Sensitive Data
- Never include API keys in component code
- Use environment files (already gitignored)
- Review files before pushing

---

## Requirements

- **Node.js:** 16+
- **Angular:** 14+
- **GitHub CLI:** 2.0+
- **Git:** 2.0+

---

## Limitations

### Known Limitations
1. **Component Location:** Components must be in `src/app/components/`
2. **Import Detection:** Only detects TypeScript imports (not dynamic imports)
3. **Single Component:** Deploys one component at a time
4. **GitHub Only:** Currently supports GitHub (not GitLab/Bitbucket)

### Workarounds
- For multiple components: Run script multiple times
- For complex dependencies: Use `dependencies.json`
- For custom structure: Modify `deploy-component.js`

---

## Maintenance

### Updating Configuration

To add new files to all deployments, edit `deploy-config.json`:

```json
"baseFiles": [
  "existing-file.ts",
  "new-file.ts"  // Add new file here
]
```

### Script Updates

Keep `deploy-component.js` updated with your project needs:
- Modify import detection patterns
- Adjust package.json filtering logic
- Customize repository structure

---

## FAQ

**Q: Can I deploy the same component to multiple repositories?**  
A: Yes, run the script multiple times with different repository names.

**Q: What if my component uses dynamic imports?**  
A: Add those dependencies manually in `dependencies.json`.

**Q: Can I customize the repository structure?**  
A: Yes, modify the `copyDirectory()` calls in `deploy-component.js`.

**Q: Does this work with Angular standalone components?**  
A: Yes, it works with both module-based and standalone components.

**Q: What Angular versions are supported?**  
A: Angular 14+ (tested up to Angular 18).

**Q: Can I deploy to an existing repository?**  
A: No, it creates new repositories. To update, delete the old repo first.

**Q: How do I undo a deployment?**  
A: Delete the repository on GitHub: `gh repo delete username/repo-name`

---

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Verify GitHub CLI is authenticated: `gh auth status`
3. Ensure component exists in `src/app/components/`
4. Review console output for specific errors

---

## Contributing

To improve this tool:
1. Modify `deploy-component.js` for custom behavior
2. Update `deploy-config.json` for your project structure
3. Add custom dependency detection patterns
4. Share improvements with your team

---

## License

MIT License - Feel free to use in your projects.

---

## Author

Built for Angular developers who want to showcase individual components in separate repositories.
