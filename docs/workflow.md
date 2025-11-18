## 🔍 What It Does

### Interactive Prompts

The tool will ask you:

1. **Component name**: `word-cloud` (name of folder in `src/app/components/`)
2. **Repository name**: `word-cloud-demo` (new GitHub repo name)
3. **Visibility**: `public` or `private` (default: public)
4. **Description**: Optional description for the repo

# Follow the prompts:
### Example Session
```
🚀 Angular Component Deployment Tool

📦 Component name (e.g., word-cloud): word-cloud
📝 New repository name: word-cloud-demo
🔒 Repository visibility (public/private) [public]: public
📄 Repository description (optional): Interactive 3D word cloud

⚙️  Starting deployment process...

# ✅ Repository created
# ✅ Component deployed
# ✅ GitHub Pages enabled
# ✅ Live at: https://your-username.github.io/awesome-component-demo/

```

### What Happens

1. **Analysis** (10 sec) - Detects dependencies
2. **Repository Creation** (5 sec) - Creates GitHub repo
3. **File Copying** (15 sec) - Copies component and dependencies
4. **Package Filtering** (10 sec) - Creates optimized package.json
5. **Git Push** (10 sec) - Pushes to GitHub
6. **GitHub Actions Wait** (1-3 min) - Waits for workflow to complete
7. **Pages Activation** (10 sec) - Enables GitHub Pages

**Total Time: 2-4 minutes**


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

## 📖 The Complete Workflow

- ✅ Extracts a component from your monorepo
- ✅ Creates a new GitHub repository
- ✅ Copies only necessary dependencies (filtered package.json)
- ✅ Sets up GitHub Actions for automatic deployment
- ✅ Configures GitHub Pages
- ✅ Auto-detects and includes npm packages used by the component


## ✨ Key Features

### 🤖 AI-First Workflow
- Generate components with ChatGPT, Claude, Cursor, or any AI tool
- Drop generated files directly into `src/app/components/`
- No manual setup required

### 🔄 Automated Everything
- **Repository Creation** - GitHub repository created automatically
- **GitHub Pages Setup** - Deployed and live instantly
- **Dependency Detection** - Auto-finds services, models, and npm packages
- **Import Path Updates** - Converts from `components/[name]` to `[name]`
- **Package Filtering** - Only includes packages your component actually uses

### 📦 Smart Packaging
- Detects and copies all dependencies (services, models, shared modules)
- Filters `package.json` from 100+ packages to only what's needed
- Generates or uses component-specific README
- Handles assets, fonts, and environment files

### 🌐 GitHub Pages Ready
- Automatic GitHub Pages deployment
- Live demo URL: `https://your-username.github.io/component-name/`
- Works with custom domains
- SSL enabled by default

### 🎨 Component Showcase
- Each component gets its own repository
- Clean, focused demos
- Shareable links for portfolios
- Perfect for job applications


### Step 1: Generate Component with AI

Use any AI tool to generate your component:

**Example Prompt for ChatGPT/Claude:**
```
Create an Angular component that displays a 3D rotating word cloud 
using Three.js. Include drag-to-rotate functionality and make it 
responsive for mobile devices.
```

### Step 2: Integrate into Project

Copy the generated files:

```bash
# Create component folder
mkdir src/app/components/word-cloud

# Copy AI-generated files
src/app/components/word-cloud/
├── word-cloud.component.ts
├── word-cloud.component.html
├── word-cloud.component.css
└── README.md (optional)
```

### Step 3: Test Locally (Optional)

```bash
# Add component to routes if needed
# Edit src/app/app.routes.ts

# Test locally
npm start
# Visit http://localhost:4200/
```

### Step 4: Deploy with One Command

```bash
npm run deploy-component
```

### Step 5: Share Your Live Demo

Your component is now live at:
```
https://your-username.github.io/component-name/
```

Share this link:
- In your portfolio
- On LinkedIn
- In job applications
- With clients
- On Twitter/X
