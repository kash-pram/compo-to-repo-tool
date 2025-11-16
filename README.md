Step 1: Install GitHub CLI (One-time setup)

# Windows
winget install GitHub.cli

# Mac
brew install gh

# Linux (Debian/Ubuntu)
sudo apt install gh

# After installation, authenticate:
gh auth login
```

---

## **Step 2: Project Structure**
```
your-angular-project/
├── src/
│   ├── app/
│   │   ├── word-cloud/
│   │   │   ├── word-cloud.component.ts
│   │   │   └── README.md          # Component-specific README
│   │   ├── other-component/
│   │   │   ├── other.component.ts
│   │   │   └── README.md
│   │   └── app.component.ts
│   ├── main.ts
│   ├── index.html
│   └── styles.css
├── package.json
├── angular.json
├── tsconfig.json
├── deploy-config.json              # NEW: Configuration file
├── deploy-component.js             # NEW: Deployment script
└── .gitignore

Step 3: Create deploy-config.json

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
    "src/styles.scss",
    "src/app/app.component.ts",
    "src/app/app.component.html",
    "src/app/app.component.css",
    "src/app/app.config.ts",
    "src/app/app.routes.ts"
  ],
  "githubUsername": "your-github-username",
  "defaultVisibility": "public"
}

Step 4: Create deploy-component.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Load configuration
const config = JSON.parse(fs.readFileSync('deploy-config.json', 'utf8'));

// Utility: Execute command and return output
function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (error) {
    console.error(`❌ Error executing: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Utility: Copy file with directory creation
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

// Utility: Copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Utility: Check if component exists
function componentExists(componentName) {
  const componentPath = path.join('src', 'app', componentName);
  return fs.existsSync(componentPath);
}

// Main deployment function
async function deployComponent() {
  console.log('🚀 Angular Component Deployment Tool\n');
  
  // Step 1: Get component name
  const componentName = await question('📦 Component name (e.g., word-cloud): ');
  
  if (!componentName.trim()) {
    console.error('❌ Component name cannot be empty!');
    rl.close();
    process.exit(1);
  }
  
  if (!componentExists(componentName)) {
    console.error(`❌ Component "${componentName}" not found in src/app/`);
    rl.close();
    process.exit(1);
  }
  
  // Step 2: Get repository name
  const repoName = await question('📝 New repository name: ');
  
  if (!repoName.trim()) {
    console.error('❌ Repository name cannot be empty!');
    rl.close();
    process.exit(1);
  }
  
  // Step 3: Get repository visibility
  const visibility = await question('🔒 Repository visibility (public/private) [public]: ');
  const repoVisibility = visibility.trim().toLowerCase() || config.defaultVisibility || 'public';
  
  // Step 4: Get repository description
  const description = await question('📄 Repository description (optional): ');
  
  rl.close();
  
  console.log('\n⚙️  Starting deployment process...\n');
  
  const tempDir = path.join(process.cwd(), 'temp-deploy');
  
  try {
    // Clean up any existing temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    // Step 5: Create GitHub repository
    console.log('📦 Creating GitHub repository...');
    let createCommand = `gh repo create ${repoName} --${repoVisibility}`;
    if (description.trim()) {
      createCommand += ` --description "${description.trim()}"`;
    }
    
    exec(createCommand);
    console.log('✓ Repository created successfully!\n');
    
    const repoUrl = `https://github.com/${config.githubUsername}/${repoName}`;
    console.log(`🔗 Repository URL: ${repoUrl}\n`);
    
    // Step 6: Create temp directory structure
    console.log('📁 Creating project structure...');
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Step 7: Copy base files
    console.log('📋 Copying base Angular files...');
    let copiedCount = 0;
    let skippedCount = 0;
    
    config.baseFiles.forEach(file => {
      const srcPath = path.join(process.cwd(), file);
      const destPath = path.join(tempDir, file);
      
      if (copyFile(srcPath, destPath)) {
        copiedCount++;
      } else {
        skippedCount++;
      }
    });
    
    console.log(`✓ Copied ${copiedCount} base files (${skippedCount} not found, skipped)\n`);
    
    // Step 8: Copy component directory
    console.log(`📦 Copying ${componentName} component...`);
    const componentSrc = path.join(process.cwd(), 'src', 'app', componentName);
    const componentDest = path.join(tempDir, 'src', 'app', componentName);
    copyDirectory(componentSrc, componentDest);
    console.log('✓ Component copied successfully!\n');
    
    // Step 9: Handle component-specific README
    console.log('📝 Processing README.md...');
    const componentReadmePath = path.join(componentSrc, 'README.md');
    const destReadmePath = path.join(tempDir, 'README.md');
    
    if (fs.existsSync(componentReadmePath)) {
      // Use component-specific README
      fs.copyFileSync(componentReadmePath, destReadmePath);
      console.log('✓ Using component-specific README.md\n');
    } else {
      // Generate default README
      const defaultReadme = generateDefaultReadme(componentName, repoName, description);
      fs.writeFileSync(destReadmePath, defaultReadme);
      console.log('✓ Generated default README.md\n');
    }
    
    // Step 10: Create/copy .gitignore if not exists
    const gitignorePath = path.join(tempDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      const defaultGitignore = `# See http://help.github.com/ignore-files/ for more about ignoring files.

# Compiled output
/dist
/tmp
/out-tsc
/bazel-out

# Node
/node_modules
npm-debug.log
yarn-error.log

# IDEs and editors
.idea/
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# Visual Studio Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.history/*

# Miscellaneous
/.angular/cache
.sass-cache/
/connect.lock
/coverage
/libpeerconnection.log
testem.log
/typings

# System files
.DS_Store
Thumbs.db
`;
      fs.writeFileSync(gitignorePath, defaultGitignore);
      console.log('✓ Created .gitignore\n');
    }
    
    // Step 11: Initialize git and push
    console.log('🔧 Initializing Git repository...');
    process.chdir(tempDir);
    
    exec('git init');
    exec('git add .');
    exec('git commit -m "Initial commit: Angular base + ' + componentName + ' component"');
    exec('git branch -M main');
    exec(`git remote add origin ${repoUrl}.git`);
    
    console.log('📤 Pushing to GitHub...');
    exec('git push -u origin main');
    console.log('✓ Pushed successfully!\n');
    
    // Step 12: Cleanup
    process.chdir('..');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete!\n');
    
    // Success message
    console.log('🎉 SUCCESS! Deployment completed!\n');
    console.log('═══════════════════════════════════════');
    console.log(`📦 Component: ${componentName}`);
    console.log(`🔗 Repository: ${repoUrl}`);
    console.log(`👁️  Visibility: ${repoVisibility}`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Deployment failed!');
    console.error(error.message);
    
    // Cleanup on error
    process.chdir(process.cwd());
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

// Generate default README
function generateDefaultReadme(componentName, repoName, description) {
  const componentTitle = componentName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return `# ${componentTitle}

${description || `Angular component: ${componentTitle}`}

## Description

This repository contains an Angular component built with TypeScript.

## Component

- **${componentName}**: Main component in this repository

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run development server:
   \`\`\`bash
   ng serve
   \`\`\`

3. Navigate to \`http://localhost:4200/\`

## Build

Run \`ng build\` to build the project. The build artifacts will be stored in the \`dist/\` directory.

## Technologies

- Angular
- TypeScript
- Three.js (if applicable)

## License

MIT License

---

Generated using Angular Component Deployment Tool
`;
}

// Run the deployment
deployComponent();

Step 5: Add NPM script to package.json

{
  "scripts": {
    "deploy-component": "node deploy-component.js"
  }
}

Step 6: Create Component-Specific README (Example)
File: src/app/word-cloud/README.md

# 3D Rotating Word Cloud

An interactive 3D word cloud built with Angular and Three.js that allows users to rotate words like a globe.

## Features

- 🌐 3D spherical word arrangement
- 🖱️ Drag to rotate (like Google Earth)
- 📱 Touch support for mobile devices
- ✨ Smooth momentum physics
- 🎨 Customizable colors
- 👁️ Words always face the camera (readable)

## Installation

1. Install dependencies:
```bash
   npm install
```

2. Install Three.js:
```bash
   npm install three
   npm install --save-dev @types/three
```

## Usage

1. Run the development server:
```bash
   ng serve
```

2. Open your browser and navigate to `http://localhost:4200/`

3. Interact with the word cloud:
   - Click and drag to rotate
   - Use "Pause/Play" button to control auto-rotation
   - Click "Randomize Colors" to change word colors

## Customization

### Change Word List

Edit the `words` array in `word-cloud.component.ts`:
```typescript
private words = [
  { text: 'Your Word', size: 40 },
  { text: 'Another Word', size: 35 },
  // Add more words...
];
```

### Change Cloud Size

Modify the `radius` variable in `createWordCloud()` method:
```typescript
const radius = 150; // Smaller = tighter cloud
```

### Change Font Style

Update the font in `createWordCloud()` method:
```typescript
context.font = `${fontSize}px Arial`; // Remove 'bold' for normal weight
```

### Single Color Cloud

Change the color assignment:
```typescript
color: 0x4ecdc4  // Single hex color
```

## Technologies

- **Angular 20** - Frontend framework
- **TypeScript** - Programming language
- **Three.js** - 3D rendering library
- **WebGL** - Graphics API

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT License

## Author

[Your Name]

---

Built with ❤️ using Angular

Step 7: Usage

npm run deploy-component
```

**Interactive prompts:**
```
🚀 Angular Component Deployment Tool

📦 Component name (e.g., word-cloud): word-cloud
📝 New repository name: my-wordcloud-demo
🔒 Repository visibility (public/private) [public]: public
📄 Repository description (optional): Interactive 3D word cloud with Angular

⚙️  Starting deployment process...

📦 Creating GitHub repository...
✓ Repository created successfully!

🔗 Repository URL: https://github.com/yourusername/my-wordcloud-demo

📁 Creating project structure...
📋 Copying base Angular files...
✓ Copied 12 base files (2 not found, skipped)

📦 Copying word-cloud component...
✓ Component copied successfully!

📝 Processing README.md...
✓ Using component-specific README.md

✓ Created .gitignore

🔧 Initializing Git repository...
📤 Pushing to GitHub...
✓ Pushed successfully!

✓ Cleanup complete!

🎉 SUCCESS! Deployment completed!

═══════════════════════════════════════
📦 Component: word-cloud
🔗 Repository: https://github.com/yourusername/my-wordcloud-demo
👁️  Visibility: public
═══════════════════════════════════════

Features:
✅ Zero npm dependencies (only built-in Node.js modules)
✅ Auto-creates GitHub repository
✅ Uses component-specific README.md if exists
✅ Generates default README if component README not found
✅ Copies only base Angular + specific component
✅ Interactive prompts
✅ Error handling and cleanup
✅ Cross-platform (Windows/Mac/Linux)

Ready to use! Just update deploy-config.json with your GitHub username and run the command!