# Angular Component Deployment Automation Tool

**Automate the deployment of Angular components to GitHub with automatic GitHub Pages setup.**

This tool takes a single Angular component from your project and deploys it to a new GitHub repository with full GitHub Pages support, including automatic CI/CD via GitHub Actions.

---

## 📋 Table of Contents

- [Purpose](#purpose)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [How to Use](#how-to-use)
- [What It Does](#what-it-does)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [File Structure](#file-structure)
- [Customization](#customization)

---

## 🎯 Purpose

This automation tool solves the problem of deploying individual Angular components as standalone projects. It:

- ✅ Extracts a component from your monorepo
- ✅ Creates a new GitHub repository
- ✅ Copies only necessary dependencies (filtered package.json)
- ✅ Sets up GitHub Actions for automatic deployment
- ✅ Configures GitHub Pages
- ✅ Auto-detects and includes npm packages used by the component

**Use Cases:**
- Sharing components as live demos
- Creating portfolio projects
- Component library showcases
- Client demonstrations

---

## 📦 Prerequisites

### Required Software

1. **Node.js** (v20.19+)
```bash
   node --version  # Should be 20.19 or higher
```

2. **GitHub CLI** (gh)
```bash
   # Install GitHub CLI
   # Windows: Download from https://cli.github.com/
   # Mac: brew install gh
   # Linux: See https://github.com/cli/cli#installation
   
   # Verify installation
   gh --version
   
   # Authenticate (if not already done)
   gh auth login
```

3. **Angular CLI** (v20+)
```bash
   npm install -g @angular/cli
   ng version
```

### Repository Requirements

- ✅ Angular 20+ project
- ✅ Components located in `src/app/components/`
- ✅ Git initialized
- ✅ GitHub account

---

## 🚀 Setup

### Step 1: Add Tool Files to Your Project Root

Place these files in your Angular project root:
```
your-angular-project/
├── src/
├── deploy-component.js       ← Add this
├── deploy-config.json         ← Add this
├── package.json
└── angular.json
```

### Step 2: Configure `deploy-config.json`

Edit `deploy-config.json` and update your GitHub username:
```json
{
  "githubUsername": "your-github-username",  // ← CHANGE THIS
  "defaultVisibility": "public",
  "githubPages": {
    "enabled": true,
    "createWorkflow": true,
    "create404": true
  },
  ...
}
```

### Step 3: Organize Your Components

Ensure your component is in the correct location:
```
src/app/components/
└── your-component/
    ├── your-component.ts
    ├── your-component.html
    └── your-component.css
```

---

## 💻 How to Use

### Basic Usage
```bash
node deploy-component.js
```

### Interactive Prompts

The tool will ask you:

1. **Component name**: `word-cloud` (name of folder in `src/app/components/`)
2. **Repository name**: `word-cloud-demo` (new GitHub repo name)
3. **Visibility**: `public` or `private` (default: public)
4. **Description**: Optional description for the repo

### Example Session
```
🚀 Angular Component Deployment Tool

📦 Component name (e.g., word-cloud): word-cloud
📝 New repository name: word-cloud-demo
🔒 Repository visibility (public/private) [public]: public
📄 Repository description (optional): Interactive 3D word cloud

⚙️  Starting deployment process...
```

### What Happens Next

1. **Analysis** (10 sec) - Detects dependencies
2. **Repository Creation** (5 sec) - Creates GitHub repo
3. **File Copying** (15 sec) - Copies component and dependencies
4. **Package Filtering** (10 sec) - Creates optimized package.json
5. **Git Push** (10 sec) - Pushes to GitHub
6. **GitHub Actions Wait** (1-3 min) - Waits for workflow to complete
7. **Pages Activation** (10 sec) - Enables GitHub Pages

**Total Time: 2-4 minutes**

---

## 🔍 What It Does

### Automatic Actions

| Step | What Happens | Files Affected |
|------|-------------|----------------|
| **1. Dependency Detection** | Scans component for imports | Component `.ts` files |
| **2. Repo Creation** | Creates GitHub repository | GitHub |
| **3. File Copy** | Copies component to temp directory | `src/app/components/[name]` → `temp-deploy/src/app/[name]` |
| **4. Package Filtering** | Creates minimal package.json | Only used dependencies included |
| **5. Lock File Generation** | Generates package-lock.json | Ensures consistent installs |
| **6. Workflow Creation** | Creates GitHub Actions workflow | `.github/workflows/deploy.yml` |
| **7. Angular Config** | Updates angular.json for Pages | Base href, 404.html |
| **8. Git Push** | Pushes to main branch | All files to GitHub |
| **9. Workflow Wait** | Monitors GitHub Actions | Polls every 15 seconds |
| **10. Pages Enable** | Activates GitHub Pages | API call to enable Pages |

### Files Created in New Repo
```
new-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml           ← Auto-deploy workflow
├── src/
│   ├── app/
│   │   └── your-component/      ← Your component
│   ├── index.html
│   └── 404.html                 ← For Angular routing
├── package.json                 ← Filtered dependencies
├── package-lock.json            ← Generated lock file
├── angular.json                 ← Updated config
└── README.md                    ← Auto-generated docs
```

---

## ⚙️ Configuration

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

## 🔧 Troubleshooting

### Issue 1: GitHub Actions Workflow Fails

**Symptom:** Workflow runs but fails to build

**Causes:**
- Missing dependencies in package.json
- TypeScript compilation errors
- Angular version mismatch

**Solution:**

1. Check the Actions tab in your GitHub repo
2. Look at the build logs
3. Common fixes:
```bash
   # If dependencies are missing, add them manually to package.json
   # in the GitHub repo, then push
   
   # Or re-run deployment with manual package.json edit
```

### Issue 2: gh-pages Branch Not Created

**Symptom:** Workflow completes but no gh-pages branch exists

**Causes:**
- Workflow permissions issue
- Build output path incorrect
- GitHub Actions not enabled

**Manual Fix:**

1. **Check workflow permissions:**
   - Go to repo Settings → Actions → General
   - Under "Workflow permissions", select "Read and write permissions"
   - Click Save

2. **Manually create gh-pages branch:**
```bash
   # Clone the new repo
   git clone https://github.com/your-username/repo-name.git
   cd repo-name
   
   # Build locally
   npm install
   npm run build
   
   # Create gh-pages branch
   git checkout --orphan gh-pages
   git rm -rf .
   
   # Copy build files
   cp -r dist/project-name/browser/* .
   
   # Add .nojekyll file
   touch .nojekyll
   
   # Commit and push
   git add .
   git commit -m "Initial GitHub Pages deployment"
   git push origin gh-pages
```

3. **Enable Pages manually:**
   - Go to repo Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` / `/ (root)`
   - Click Save

### Issue 3: GitHub Pages Not Enabled Automatically

**Symptom:** Workflow succeeds, gh-pages branch exists, but Pages not active

**Causes:**
- API permissions issue
- GitHub CLI not authenticated
- Timeout during auto-enable

**Manual Fix:**

1. Go to: `https://github.com/your-username/repo-name/settings/pages`
2. Under **Source**: Select "Deploy from a branch"
3. Select branch: `gh-pages`
4. Select folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes for deployment
7. Site will be live at: `https://your-username.github.io/repo-name/`

### Issue 4: Site Shows 404 or Blank Page

**Causes:**
- Incorrect base href
- Missing 404.html
- Files not in browser folder

**Solution:**

1. **Check base href in deployed index.html:**
   - View source of your deployed site
   - Look for: `<base href="/repo-name/">`
   - Must match your repository name exactly

2. **Update angular.json if needed:**
```json
   "production": {
     "baseHref": "/repo-name/"  // Must match repo name
   }
```

3. **Rebuild and redeploy:**
   - Push changes to main branch
   - GitHub Actions will auto-rebuild

### Issue 5: Deployment Script Hangs

**Symptom:** Script shows dots `....` and never completes

**Causes:**
- Workflow taking longer than 5 minutes
- Network timeout
- GitHub API rate limit

**Solution:**

1. **Press Ctrl+C** to exit the script
2. Deployment is already complete in GitHub
3. Manually enable Pages (see Issue 3)
4. **Or increase timeout in script:**
```javascript
   // In deploy-component.js, find:
   const maxAttempts = 20; // 5 minutes
   
   // Change to:
   const maxAttempts = 40; // 10 minutes
```

### Issue 6: Package Dependencies Missing

**Symptom:** Build fails with "Cannot find module 'package-name'"

**Cause:** Auto-detection missed a dependency

**Solution:**

1. **Check detected packages:**
   - Look at console output during deployment
   - It shows: `✓ Found X npm packages`

2. **Manually add to new repo:**
   - Clone the new repository
   - Edit `package.json`, add missing dependency:
```json
     "dependencies": {
       "three": "^0.160.0"  // Add missing package
     }
```
   - Commit and push:
```bash
     git add package.json
     git commit -m "Add missing dependency"
     git push origin main
```

3. **Improve detection (for future deployments):**
   - Check your import syntax in component
   - The tool detects: `import * as X from 'pkg'`, `import { X } from 'pkg'`, etc.

### Issue 7: TypeScript Compilation Errors

**Symptom:** Workflow fails with TS errors

**Causes:**
- Missing type declarations
- Version mismatches
- Incompatible packages

**Solution:**

Add type declarations in the new repo:
```bash
npm install --save-dev @types/three  # For three.js
npm install --save-dev @types/node   # For Node.js types
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

## ✅ Pre-Deployment Checklist

Before running the tool, verify:

- [ ] GitHub CLI installed and authenticated (`gh auth status`)
- [ ] Node.js v20.19+ installed (`node --version`)
- [ ] Component exists in `src/app/components/[name]/`
- [ ] Component has all necessary files (.ts, .html, .css)
- [ ] `deploy-config.json` has your GitHub username
- [ ] You're in the Angular project root directory
- [ ] Component builds successfully in your project (`ng serve`)

---

## 🚦 Post-Deployment Checklist

After running the tool, verify:

- [ ] GitHub repository created successfully
- [ ] GitHub Actions workflow completed (check Actions tab)
- [ ] gh-pages branch exists in repository
- [ ] GitHub Pages is enabled (Settings → Pages)
- [ ] Site is live and accessible
- [ ] All component features work correctly
- [ ] No console errors on deployed site

---

## 📞 Support

### Common Commands
```bash
# Check GitHub CLI auth status
gh auth status

# View workflow runs
gh run list --repo username/repo-name

# View workflow logs
gh run view --repo username/repo-name

# Check Node version
node --version

# Check npm version
npm --version
```

### Useful Links

- **GitHub CLI Docs**: https://cli.github.com/manual/
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Angular Docs**: https://angular.dev

---

## 📝 Notes

- **Build Time**: First deployment takes 2-4 minutes
- **Subsequent Deploys**: Pushing to main branch auto-deploys (1-2 min)
- **Rate Limits**: GitHub API has rate limits; avoid rapid deployments
- **Storage**: Each repo counts toward your GitHub storage quota
- **Private Repos**: Private repos on free accounts have limited Actions minutes

---

## 🎉 Success Indicators

You'll know deployment succeeded when you see:
```
🎉 SUCCESS! Deployment completed!

═══════════════════════════════════════
📦 Component: word-cloud
🔗 Repository: https://github.com/user/word-cloud-demo
👁️  Visibility: public
📊 Dependencies: 5 items
🌐 GitHub Pages: Enabled
🔗 Site URL: https://user.github.io/word-cloud-demo/
⚙️  Auto-deploy: On push to main branch
═══════════════════════════════════════
```

Visit the site URL to see your deployed component live! 🚀

---

**Made with ❤️ for Angular Developers**