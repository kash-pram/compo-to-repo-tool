I tried with the previous version of the deployment code. THe repository got created in the Github but only the base files are uploaded. Component files are missing. The component was present inside the src/app/ folder, I updated the script to look for the component inside that folder before running the script.

Let me help you debug this. The issue is likely in the file copying logic. Let's add detailed logging to see what's happening:

Quick Debug Version - Add This to Your Script
Replace the section where it copies the component (around Step 9) with this enhanced version:
javascript// Step 9: Copy component directory
console.log(`📦 Copying ${componentName} component...`);
const componentSrc = path.join(process.cwd(), 'src', 'app', componentName);
const componentDest = path.join(tempDir, 'src', 'app', componentName);

console.log(`   Source: ${componentSrc}`);
console.log(`   Destination: ${componentDest}`);
console.log(`   Component exists: ${fs.existsSync(componentSrc)}`);

if (!fs.existsSync(componentSrc)) {
  console.error(`❌ Component source directory not found: ${componentSrc}`);
  throw new Error('Component directory not found');
}

// List files in component directory
const componentFiles = fs.readdirSync(componentSrc);
console.log(`   Files to copy: ${componentFiles.join(', ')}`);

copyDirectory(componentSrc, componentDest);

// Verify files were copied
if (fs.existsSync(componentDest)) {
  const copiedFiles = fs.readdirSync(componentDest);
  console.log(`   Files copied: ${copiedFiles.join(', ')}`);
  console.log('✓ Component copied successfully!\n');
} else {
  console.error('❌ Component destination directory not created!');
  throw new Error('Failed to copy component');
}

Also Check the copyDirectory Function
Make sure your copyDirectory function looks exactly like this:
javascript// Utility: Copy directory recursively
function copyDirectory(src, dest) {
  console.log(`   Copying directory: ${src} -> ${dest}`);
  
  if (!fs.existsSync(src)) {
    console.warn(`   ⚠️  Source does not exist: ${src}`);
    return;
  }
  
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
    console.log(`   Created directory: ${dest}`);
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  console.log(`   Found ${entries.length} entries in ${src}`);
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      console.log(`   Copying subdirectory: ${entry.name}`);
      copyDirectory(srcPath, destPath);
    } else {
      console.log(`   Copying file: ${entry.name}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

Common Issues & Fixes:
Issue 1: Working Directory Changed
The script changes directory when pushing to Git. Make sure we're in the right directory:
javascript// BEFORE Step 9, add this:
const originalDir = process.cwd();
console.log(`Current working directory: ${originalDir}`);

Issue 2: Git Ignoring Files
The temp directory might have a .gitignore that's ignoring component files. Add this check:
javascript// After copying component, BEFORE git init:
const tempGitignore = path.join(tempDir, '.gitignore');
if (fs.existsSync(tempGitignore)) {
  console.log('Checking .gitignore content:');
  console.log(fs.readFileSync(tempGitignore, 'utf8'));
}

Issue 3: Path Join Issues on Windows
Try using forward slashes explicitly:
javascriptconst componentSrc = path.join(process.cwd(), 'src', 'app', componentName);
console.log(`Normalized path: ${componentSrc.replace(/\\/g, '/')}`);

Complete Fixed Version - Step 9:
javascript// Step 9: Copy component directory
console.log(`\n${'='.repeat(50)}`);
console.log(`📦 COPYING COMPONENT: ${componentName}`);
console.log('='.repeat(50));

const originalDir = process.cwd();
const componentSrc = path.join(originalDir, 'src', 'app', componentName);
const componentDest = path.join(tempDir, 'src', 'app', componentName);

console.log(`\n🔍 Debug Information:`);
console.log(`   Current Dir: ${originalDir}`);
console.log(`   Component Source: ${componentSrc}`);
console.log(`   Component Dest: ${componentDest}`);
console.log(`   Source Exists: ${fs.existsSync(componentSrc)}`);

if (!fs.existsSync(componentSrc)) {
  console.error(`\n❌ ERROR: Component directory not found!`);
  console.error(`   Looking for: ${componentSrc}`);
  console.error(`\n   Available components:`);
  
  const appDir = path.join(originalDir, 'src', 'app');
  if (fs.existsSync(appDir)) {
    const components = fs.readdirSync(appDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    console.error(`   ${components.join(', ')}`);
  }
  
  throw new Error('Component directory not found');
}

// List source files
console.log(`\n📂 Source files:`);
const sourceFiles = fs.readdirSync(componentSrc);
sourceFiles.forEach(file => console.log(`   - ${file}`));

// Copy the directory
console.log(`\n📋 Starting copy operation...`);
copyDirectory(componentSrc, componentDest);

// Verify copy
console.log(`\n✅ Verification:`);
if (fs.existsSync(componentDest)) {
  const destFiles = fs.readdirSync(componentDest);
  console.log(`   Destination files:`);
  destFiles.forEach(file => console.log(`   - ${file}`));
  
  if (destFiles.length === sourceFiles.length) {
    console.log(`   ✓ All ${destFiles.length} files copied successfully!`);
  } else {
    console.warn(`   ⚠️  File count mismatch! Source: ${sourceFiles.length}, Dest: ${destFiles.length}`);
  }
} else {
  console.error(`   ❌ Destination directory was not created!`);
  throw new Error('Failed to create destination directory');
}

console.log('='.repeat(50));
console.log(`✓ Component ${componentName} copied successfully!\n`);

Quick Test Before Running Full Script:
Add this test function at the beginning of your script:
javascript// Add this function
function testComponentCopy(componentName) {
  console.log('\n🧪 TESTING COMPONENT COPY\n');
  
  const testDir = path.join(process.cwd(), 'test-copy');
  const componentSrc = path.join(process.cwd(), 'src', 'app', componentName);
  const componentDest = path.join(testDir, 'src', 'app', componentName);
  
  // Clean test directory
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  console.log(`Source: ${componentSrc}`);
  console.log(`Exists: ${fs.existsSync(componentSrc)}\n`);
  
  if (fs.existsSync(componentSrc)) {
    copyDirectory(componentSrc, componentDest);
    
    if (fs.existsSync(componentDest)) {
      console.log('✓ Test copy successful!');
      const files = fs.readdirSync(componentDest);
      console.log(`Files: ${files.join(', ')}`);
    } else {
      console.error('❌ Test copy failed!');
    }
  }
  
  // Cleanup
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  
  console.log('\n');
}

// Then call it before deployComponent():
// testComponentCopy('word-cloud');

Run the script with these debug logs and tell me:

What does it print for "Component Source"?
Does it say "Source Exists: true"?
What files are listed under "Source files"?
What files are listed under "Destination files"?
Any error messages?

This will help me pinpoint exactly where the issue is!






My previous prompt had a path folder name mistake. Here is the correct prompt:

I tried with the previous version of the deployment code. The repository got created in the Github but only the base files are uploaded. Component files are missing. The component was present inside the src/app/Components/ folder, I updated the script to look for the component inside the Components folder before running the script.

Ah! That's the issue - your components are in src/app/Components/ (with capital C) but the script is looking in src/app/!

Quick Fix: Update deploy-config.json
Add a componentsFolder configuration:
json{
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
  "componentsFolder": "src/app/Components",
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
  ],
  "autoCopyAssets": true
}

Update the deploy-component.js Script
Change 1: Update componentExists function
javascript// Utility: Check if component exists
function componentExists(componentName) {
  const componentsFolder = config.componentsFolder || path.join('src', 'app');
  const componentPath = path.join(componentsFolder, componentName);
  return fs.existsSync(componentPath);
}

Change 2: Update the component path references
Find these lines in the deployComponent() function and update them:
javascript// OLD (around line 50):
const componentPath = path.join(process.cwd(), 'src', 'app', componentName);

// NEW:
const componentsFolder = config.componentsFolder || path.join('src', 'app');
const componentPath = path.join(process.cwd(), componentsFolder, componentName);

Change 3: Update Step 9 (Copy component directory)
javascript// Step 9: Copy component directory
console.log(`📦 Copying ${componentName} component...`);

const componentsFolder = config.componentsFolder || path.join('src', 'app');
const componentSrc = path.join(process.cwd(), componentsFolder, componentName);
const componentDest = path.join(tempDir, componentsFolder, componentName);

console.log(`   Source: ${componentSrc}`);
console.log(`   Destination: ${componentDest}`);
console.log(`   Component exists: ${fs.existsSync(componentSrc)}`);

if (!fs.existsSync(componentSrc)) {
  console.error(`❌ Component source directory not found: ${componentSrc}`);
  
  // Show available components
  const componentsDir = path.join(process.cwd(), componentsFolder);
  if (fs.existsSync(componentsDir)) {
    console.error(`\n   Available components in ${componentsFolder}:`);
    const components = fs.readdirSync(componentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    console.error(`   ${components.join(', ')}`);
  }
  
  throw new Error('Component directory not found');
}

copyDirectory(componentSrc, componentDest);

// Verify files were copied
if (fs.existsSync(componentDest)) {
  const copiedFiles = fs.readdirSync(componentDest);
  console.log(`   Files copied: ${copiedFiles.join(', ')}`);
  console.log('✓ Component copied successfully!\n');
} else {
  console.error('❌ Component destination directory not created!');
  throw new Error('Failed to copy component');
}

Change 4: Update dependency detection
Find the loadComponentDependencies function and update it:
javascript// NEW: Load component dependencies
function loadComponentDependencies(componentName) {
  const componentsFolder = config.componentsFolder || path.join('src', 'app');
  const depsPath = path.join(componentsFolder, componentName, 'dependencies.json');
  
  if (fs.existsSync(depsPath)) {
    try {
      return JSON.parse(fs.readFileSync(depsPath, 'utf8'));
    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse dependencies.json for ${componentName}`);
      return null;
    }
  }
  return null;
}

Change 5: Update README handling (Step 11)
javascript// Step 11: Handle component-specific README
console.log('📝 Processing README.md...');

const componentsFolder = config.componentsFolder || path.join('src', 'app');
const componentReadmePath = path.join(process.cwd(), componentsFolder, componentName, 'README.md');
const destReadmePath = path.join(tempDir, 'README.md');

if (fs.existsSync(componentReadmePath)) {
  fs.copyFileSync(componentReadmePath, destReadmePath);
  console.log('✓ Using component-specific README.md\n');
} else {
  const defaultReadme = generateDefaultReadme(componentName, repoName, description);
  fs.writeFileSync(destReadmePath, defaultReadme);
  console.log('✓ Generated default README.md\n');
}
```

---

## **Alternative: Simpler Approach**

If you don't want to modify the script too much, you can also:

### **Option A: Move components to `src/app/`**

Restructure your project:
```
src/app/
├── word-cloud/          ← Move from Components/
├── other-component/     ← Move from Components/
└── app.component.ts
Option B: Update only the paths in script
Do a global find & replace in deploy-component.js:

Find: 'src', 'app'
Replace with: 'src', 'app', 'Components'


Quick Test
After making changes, verify the paths:
javascript// Add this at the beginning of deployComponent()
console.log('\n🔍 Configuration Check:');
console.log(`   Components Folder: ${config.componentsFolder || 'src/app'}`);

const testPath = path.join(process.cwd(), config.componentsFolder || path.join('src', 'app'), 'word-cloud');
console.log(`   Test Path: ${testPath}`);
console.log(`   Exists: ${fs.existsSync(testPath)}\n`);
```

---

## **Your Project Structure:**
```
your-project/
├── src/
│   ├── app/
│   │   ├── Components/           ← Your components are here
│   │   │   ├── word-cloud/
│   │   │   │   ├── word-cloud.component.ts
│   │   │   │   ├── README.md
│   │   │   │   └── dependencies.json
│   │   │   └── other-component/
│   │   ├── services/
│   │   ├── models/
│   │   └── app.component.ts
│   └── ...
├── deploy-config.json           ← Add "componentsFolder"
└── deploy-component.js

Which approach do you prefer?

Update deploy-config.json (cleanest, I recommend this)
Move components to src/app/
Manual find & replace in script

Let me know and I can provide the exact code changes needed!




okay the folder name was 'components' with small 'c'. No need to give instructions again with changed folder name with proper casing now but going forward update your instructions with the corrected name.

Got it! ✅
Going forward, I'll use src/app/components/ (lowercase 'c') in all instructions and code examples.

To summarize what you need to change in your current script:
Just update these path references from:

path.join('src', 'app', componentName)

To:

path.join('src', 'app', 'components', componentName)

Or add to deploy-config.json:
json{
  "componentsFolder": "src/app/components",
  ...
}
And update the script to use config.componentsFolder.






there is lot of confusion in the instruction to update the folder name along with dependency checks.

I don't like the approach to include folder name inside config json

"componentsFolder": "src/app/components"
It will always be inside that folder, so no need to configure it.

Give me complete instruction with corrected path folder name for components and to include all dependent files for the component.




Complete Fixed Instructions - No Confusion

Step 1: Project Structure
your-angular-project/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── word-cloud/
│   │   │   │   ├── word-cloud.component.ts
│   │   │   │   ├── word-cloud.component.html
│   │   │   │   ├── word-cloud.component.css
│   │   │   │   ├── README.md              (optional - component-specific)
│   │   │   │   └── dependencies.json      (optional - manual dependencies)
│   │   │   └── other-component/
│   │   ├── services/
│   │   │   ├── data.service.ts
│   │   │   └── api.service.ts
│   │   ├── models/
│   │   │   └── word.model.ts
│   │   ├── shared/
│   │   │   └── utils.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── main.ts
│   ├── index.html
│   └── styles.css
├── package.json
├── angular.json
├── tsconfig.json
├── deploy-config.json              (CREATE THIS)
└── deploy-component.js             (CREATE THIS)

Step 2: Create deploy-config.json
json{
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
    "src/app/app.component.scss",
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
Note: Replace "your-github-username" with your actual GitHub username.

Step 3: Create deploy-component.js
javascriptconst fs = require('fs');
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

// Utility: Execute command
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
  if (!fs.existsSync(src)) {
    console.warn(`   ⚠️  Source does not exist: ${src}`);
    return;
  }
  
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
  const componentPath = path.join('src', 'app', 'components', componentName);
  return fs.existsSync(componentPath);
}

// Load component dependencies from dependencies.json
function loadComponentDependencies(componentName) {
  const depsPath = path.join('src', 'app', 'components', componentName, 'dependencies.json');
  
  if (fs.existsSync(depsPath)) {
    try {
      return JSON.parse(fs.readFileSync(depsPath, 'utf8'));
    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse dependencies.json for ${componentName}`);
      return null;
    }
  }
  return null;
}

// Auto-detect imports from TypeScript files
function detectImports(componentPath) {
  const detected = {
    services: new Set(),
    components: new Set(),
    models: new Set(),
    shared: new Set()
  };
  
  function scanFile(filePath) {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.ts')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+{[^}]*}\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip external packages
      if (!importPath.startsWith('.') && !importPath.startsWith('@angular')) {
        continue;
      }
      
      // Convert relative imports to absolute paths
      if (importPath.startsWith('.')) {
        const dir = path.dirname(filePath);
        const absolutePath = path.resolve(dir, importPath);
        const relativePath = path.relative(process.cwd(), absolutePath);
        
        // Categorize by path
        if (relativePath.includes('services')) {
          detected.services.add(relativePath);
        } else if (relativePath.includes('models')) {
          detected.models.add(relativePath);
        } else if (relativePath.includes('shared')) {
          detected.shared.add(relativePath);
        } else if (relativePath.includes('components') && !relativePath.includes(path.basename(componentPath))) {
          detected.components.add(relativePath);
        }
      }
    }
  }
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDirectory(componentPath);
  
  return {
    services: Array.from(detected.services),
    components: Array.from(detected.components),
    models: Array.from(detected.models),
    shared: Array.from(detected.shared)
  };
}

// Copy dependencies
function copyDependencies(tempDir, dependencies, autoDetected) {
  let copiedCount = 0;
  
  console.log('📦 Copying dependencies...\n');
  
  // Merge manual and auto-detected dependencies
  const allDeps = {
    services: [...(dependencies?.dependencies?.services || []), ...autoDetected.services],
    components: [...(dependencies?.dependencies?.components || []), ...autoDetected.components],
    models: [...(dependencies?.dependencies?.models || []), ...autoDetected.models],
    shared: [...(dependencies?.dependencies?.sharedModules || []), ...autoDetected.shared],
    assets: dependencies?.dependencies?.assets || []
  };
  
  // Remove duplicates
  allDeps.services = [...new Set(allDeps.services)];
  allDeps.components = [...new Set(allDeps.components)];
  allDeps.models = [...new Set(allDeps.models)];
  allDeps.shared = [...new Set(allDeps.shared)];
  
  // Copy services
  if (allDeps.services.length > 0) {
    console.log('  📋 Services:');
    allDeps.services.forEach(service => {
      const srcPath = path.join(process.cwd(), service);
      const destPath = path.join(tempDir, service);
      
      if (fs.existsSync(srcPath)) {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          copyDirectory(srcPath, destPath);
          console.log(`    ✓ ${service}/ (directory)`);
        } else {
          if (copyFile(srcPath, destPath)) {
            console.log(`    ✓ ${service}`);
            copiedCount++;
          }
        }
      } else {
        const tsPath = srcPath + '.ts';
        if (fs.existsSync(tsPath) && copyFile(tsPath, destPath + '.ts')) {
          console.log(`    ✓ ${service}.ts`);
          copiedCount++;
        }
      }
    });
    console.log();
  }
  
  // Copy other components
  if (allDeps.components.length > 0) {
    console.log('  🧩 Related Components:');
    allDeps.components.forEach(comp => {
      const srcPath = path.join(process.cwd(), comp);
      const destPath = path.join(tempDir, comp);
      
      if (fs.existsSync(srcPath)) {
        copyDirectory(srcPath, destPath);
        console.log(`    ✓ ${comp}/`);
        copiedCount++;
      }
    });
    console.log();
  }
  
  // Copy models
  if (allDeps.models.length > 0) {
    console.log('  📐 Models/Interfaces:');
    allDeps.models.forEach(model => {
      const srcPath = path.join(process.cwd(), model);
      const destPath = path.join(tempDir, model);
      
      if (fs.existsSync(srcPath)) {
        if (copyFile(srcPath, destPath)) {
          console.log(`    ✓ ${model}`);
          copiedCount++;
        }
      } else {
        const tsPath = srcPath + '.ts';
        if (fs.existsSync(tsPath) && copyFile(tsPath, destPath + '.ts')) {
          console.log(`    ✓ ${model}.ts`);
          copiedCount++;
        }
      }
    });
    console.log();
  }
  
  // Copy shared modules
  if (allDeps.shared.length > 0) {
    console.log('  🔧 Shared Utilities:');
    allDeps.shared.forEach(shared => {
      const srcPath = path.join(process.cwd(), shared);
      const destPath = path.join(tempDir, shared);
      
      if (fs.existsSync(srcPath)) {
        if (copyFile(srcPath, destPath)) {
          console.log(`    ✓ ${shared}`);
          copiedCount++;
        }
      }
    });
    console.log();
  }
  
  // Copy assets
  if (allDeps.assets.length > 0) {
    console.log('  🖼️  Assets:');
    allDeps.assets.forEach(asset => {
      const srcPath = path.join(process.cwd(), asset);
      const destPath = path.join(tempDir, asset);
      
      if (fs.existsSync(srcPath)) {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          copyDirectory(srcPath, destPath);
          console.log(`    ✓ ${asset}/ (directory)`);
        } else {
          if (copyFile(srcPath, destPath)) {
            console.log(`    ✓ ${asset}`);
          }
        }
        copiedCount++;
      }
    });
    console.log();
  }
  
  // Copy always-include folders
  if (config.alwaysIncludeFolders && config.alwaysIncludeFolders.length > 0) {
    console.log('  📁 Always-Include Folders:');
    config.alwaysIncludeFolders.forEach(folder => {
      const srcPath = path.join(process.cwd(), folder);
      const destPath = path.join(tempDir, folder);
      
      if (fs.existsSync(srcPath)) {
        copyDirectory(srcPath, destPath);
        console.log(`    ✓ ${folder}/`);
        copiedCount++;
      }
    });
    console.log();
  }
  
  // Copy environment files
  if (dependencies?.dependencies?.environments || config.alwaysIncludeFiles) {
    console.log('  ⚙️  Environment Files:');
    const envFiles = config.alwaysIncludeFiles || [];
    
    envFiles.forEach(file => {
      const srcPath = path.join(process.cwd(), file);
      const destPath = path.join(tempDir, file);
      
      if (copyFile(srcPath, destPath)) {
        console.log(`    ✓ ${file}`);
        copiedCount++;
      }
    });
    console.log();
  }
  
  return copiedCount;
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

This repository contains an Angular component built with TypeScript, including all necessary dependencies.

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

## License

MIT License

---

Generated using Angular Component Deployment Tool
`;
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
    console.error(`❌ Component "${componentName}" not found in src/app/components/`);
    
    // Show available components
    const componentsDir = path.join(process.cwd(), 'src', 'app', 'components');
    if (fs.existsSync(componentsDir)) {
      console.error('\n   Available components:');
      const components = fs.readdirSync(componentsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      console.error(`   ${components.join(', ')}`);
    }
    
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
  const componentPath = path.join(process.cwd(), 'src', 'app', 'components', componentName);
  
  try {
    // Clean up any existing temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    // Step 5: Load component dependencies
    console.log('🔍 Analyzing dependencies...');
    const manualDeps = loadComponentDependencies(componentName);
    const autoDetected = detectImports(componentPath);
    
    if (manualDeps) {
      console.log('✓ Found dependencies.json\n');
    } else {
      console.log('✓ Using auto-detection\n');
    }
    
    // Step 6: Create GitHub repository
    console.log('📦 Creating GitHub repository...');
    let createCommand = `gh repo create ${repoName} --${repoVisibility}`;
    if (description.trim()) {
      createCommand += ` --description "${description.trim()}"`;
    }
    
    exec(createCommand);
    console.log('✓ Repository created successfully!\n');
    
    const repoUrl = `https://github.com/${config.githubUsername}/${repoName}`;
    console.log(`🔗 Repository URL: ${repoUrl}\n`);
    
    // Step 7: Create temp directory structure
    console.log('📁 Creating project structure...');
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Step 8: Copy base files
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
    
    // Step 9: Copy component directory
    console.log(`📦 Copying ${componentName} component...`);
    const componentSrc = path.join(process.cwd(), 'src', 'app', 'components', componentName);
    const componentDest = path.join(tempDir, 'src', 'app', 'components', componentName);
    
    copyDirectory(componentSrc, componentDest);
    
    if (fs.existsSync(componentDest)) {
      const copiedFiles = fs.readdirSync(componentDest);
      console.log(`✓ Component copied successfully! (${copiedFiles.length} files)\n`);
    } else {
      throw new Error('Failed to copy component');
    }
    
    // Step 10: Copy dependencies
    const depsCount = copyDependencies(tempDir, manualDeps, autoDetected);
    console.log(`✓ Copied ${depsCount} dependencies\n`);
    
    // Step 11: Handle component-specific README
    console.log('📝 Processing README.md...');
    const componentReadmePath = path.join(componentSrc, 'README.md');
    const destReadmePath = path.join(tempDir, 'README.md');
    
    if (fs.existsSync(componentReadmePath)) {
      fs.copyFileSync(componentReadmePath, destReadmePath);
      console.log('✓ Using component-specific README.md\n');
    } else {
      const defaultReadme = generateDefaultReadme(componentName, repoName, description);
      fs.writeFileSync(destReadmePath, defaultReadme);
      console.log('✓ Generated default README.md\n');
    }
    
    // Step 12: Create/copy .gitignore
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
    
    // Step 13: Initialize git and push
    console.log('🔧 Initializing Git repository...');
    process.chdir(tempDir);
    
    exec('git init');
    exec('git add .');
    exec('git commit -m "Initial commit: Angular base + ' + componentName + ' component with dependencies"');
    exec('git branch -M main');
    exec(`git remote add origin ${repoUrl}.git`);
    
    console.log('📤 Pushing to GitHub...');
    exec('git push -u origin main');
    console.log('✓ Pushed successfully!\n');
    
    // Step 14: Cleanup
    process.chdir('..');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete!\n');
    
    // Success message
    console.log('🎉 SUCCESS! Deployment completed!\n');
    console.log('═══════════════════════════════════════');
    console.log(`📦 Component: ${componentName}`);
    console.log(`🔗 Repository: ${repoUrl}`);
    console.log(`👁️  Visibility: ${repoVisibility}`);
    console.log(`📊 Dependencies: ${depsCount} items`);
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Deployment failed!');
    console.error(error.message);
    
    // Cleanup on error
    const currentDir = process.cwd();
    if (currentDir.includes('temp-deploy')) {
      process.chdir('..');
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    process.exit(1);
  }
}

// Run the deployment
deployComponent();

Step 4: Add NPM Script to package.json
json{
  "scripts": {
    "deploy-component": "node deploy-component.js"
  }
}

Step 5: (Optional) Create Component Dependencies File
If your component has dependencies, create this file:
File: src/app/components/word-cloud/dependencies.json
json{
  "component": "word-cloud",
  "description": "3D rotating word cloud",
  "dependencies": {
    "services": [
      "src/app/services/data.service.ts",
      "src/app/services/api.service.ts"
    ],
    "components": [
      "src/app/components/shared-button"
    ],
    "models": [
      "src/app/models/word.model.ts"
    ],
    "sharedModules": [
      "src/app/shared/utils.ts"
    ],
    "assets": [
      "src/assets/fonts/custom-font.woff2"
    ],
    "environments": true
  }
}

Step 6: Usage
bashnpm run deploy-component
```

**Prompts:**
```
📦 Component name (e.g., word-cloud): word-cloud
📝 New repository name: my-wordcloud-demo
🔒 Repository visibility (public/private) [public]: public
📄 Repository description (optional): Interactive 3D word cloud

What Gets Deployed:
✅ Base Angular files (from deploy-config.json)
✅ Your component from src/app/components/[component-name]/
✅ Auto-detected dependencies (services, models, other components)
✅ Manual dependencies (from dependencies.json if exists)
✅ Always-include folders (services, models, shared, environments)
✅ Component-specific README (if exists) or generated README
✅ .gitignore file

That's it! Clear, complete, and works with src/app/components/ folder structure.






does this code automatically detect dependencies based on imports in my component file? Just give me one line answer.

Yes, the detectImports() function scans all TypeScript files in your component and automatically detects dependencies from import statements.




even though I don't have services folder, model folder, will this code execute successfully to create repository and upload component + base files?
Just give me one line answer.

Yes, the code will execute successfully - it only copies folders/files that exist and skips missing ones without throwing errors.



the main angular.json has all the packages for all the components that I am trialing with but how to include only those packages names in angaular.json of the base project in this automation?

You want to filter package.json (not angular.json) to include only the dependencies that the specific component actually uses, correct?
(Angular.json is configuration, package.json contains the npm packages)RetryP


Yes package.json

Got it! You want to automatically detect which npm packages the component uses and create a filtered package.json with only those dependencies.

Add This Function to deploy-component.js
Add this function after the detectImports() function:
javascript// Detect npm packages used by component
function detectNpmDependencies(componentPath) {
  const usedPackages = new Set();
  
  function scanFile(filePath) {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.ts')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match import statements for npm packages (not relative imports)
    const importRegex = /import\s+(?:{[^}]*}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip relative imports (starting with . or /)
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        continue;
      }
      
      // Extract package name (handle scoped packages like @angular/core)
      let packageName;
      if (importPath.startsWith('@')) {
        // Scoped package: @angular/core -> @angular/core
        const parts = importPath.split('/');
        packageName = `${parts[0]}/${parts[1]}`;
      } else {
        // Regular package: lodash/get -> lodash
        packageName = importPath.split('/')[0];
      }
      
      usedPackages.add(packageName);
    }
  }
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.html')) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDirectory(componentPath);
  
  return Array.from(usedPackages);
}

// Filter package.json to only include used dependencies
function createFilteredPackageJson(tempDir, usedPackages) {
  const originalPackageJsonPath = path.join(process.cwd(), 'package.json');
  const destPackageJsonPath = path.join(tempDir, 'package.json');
  
  if (!fs.existsSync(originalPackageJsonPath)) {
    console.warn('⚠️  package.json not found!');
    return;
  }
  
  const originalPackageJson = JSON.parse(fs.readFileSync(originalPackageJsonPath, 'utf8'));
  
  // Create filtered package.json
  const filteredPackageJson = {
    name: originalPackageJson.name,
    version: originalPackageJson.version || '1.0.0',
    scripts: originalPackageJson.scripts || {},
    private: originalPackageJson.private || true,
    dependencies: {},
    devDependencies: {}
  };
  
  // Always include core Angular packages
  const corePackages = [
    '@angular/animations',
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
    'rxjs',
    'tslib',
    'zone.js'
  ];
  
  // Combine core packages with used packages
  const allRequiredPackages = [...new Set([...corePackages, ...usedPackages])];
  
  // Filter dependencies
  allRequiredPackages.forEach(pkg => {
    if (originalPackageJson.dependencies && originalPackageJson.dependencies[pkg]) {
      filteredPackageJson.dependencies[pkg] = originalPackageJson.dependencies[pkg];
    }
  });
  
  // Always include essential devDependencies
  const essentialDevDeps = [
    '@angular-devkit/build-angular',
    '@angular/cli',
    '@angular/compiler-cli',
    'typescript',
    '@types/node'
  ];
  
  essentialDevDeps.forEach(pkg => {
    if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[pkg]) {
      filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
    }
  });
  
  // Also include devDependencies for packages used by component
  usedPackages.forEach(pkg => {
    // Check for @types packages
    const typesPackage = `@types/${pkg.replace('@', '').replace('/', '__')}`;
    if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[typesPackage]) {
      filteredPackageJson.devDependencies[typesPackage] = originalPackageJson.devDependencies[typesPackage];
    }
    
    // Check if package is in devDependencies
    if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[pkg]) {
      filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
    }
  });
  
  // Write filtered package.json
  fs.writeFileSync(destPackageJsonPath, JSON.stringify(filteredPackageJson, null, 2));
  
  return {
    total: Object.keys(filteredPackageJson.dependencies).length + Object.keys(filteredPackageJson.devDependencies).length,
    dependencies: Object.keys(filteredPackageJson.dependencies).length,
    devDependencies: Object.keys(filteredPackageJson.devDependencies).length
  };
}

Update the Main deployComponent() Function
Find Step 5 (Load component dependencies) and add detection for npm packages:
javascript// Step 5: Load component dependencies
console.log('🔍 Analyzing dependencies...');
const manualDeps = loadComponentDependencies(componentName);
const autoDetected = detectImports(componentPath);

// NEW: Detect npm packages
console.log('📦 Detecting npm packages...');
const usedPackages = detectNpmDependencies(componentPath);
console.log(`✓ Found ${usedPackages.length} npm packages\n`);

if (manualDeps) {
  console.log('✓ Found dependencies.json\n');
} else {
  console.log('✓ Using auto-detection\n');
}

Update Step 8 (Copy base files)
Replace the package.json copying section:
javascript// Step 8: Copy base files (EXCEPT package.json - we'll create filtered version)
console.log('📋 Copying base Angular files...');
let copiedCount = 0;
let skippedCount = 0;

config.baseFiles.forEach(file => {
  // Skip package.json - we'll create a filtered version
  if (file === 'package.json') {
    return;
  }
  
  const srcPath = path.join(process.cwd(), file);
  const destPath = path.join(tempDir, file);
  
  if (copyFile(srcPath, destPath)) {
    copiedCount++;
  } else {
    skippedCount++;
  }
});

console.log(`✓ Copied ${copiedCount} base files (${skippedCount} not found, skipped)\n`);

// NEW: Create filtered package.json
console.log('📦 Creating filtered package.json...');
const packageStats = createFilteredPackageJson(tempDir, usedPackages);
if (packageStats) {
  console.log(`✓ Filtered package.json created:`);
  console.log(`   Dependencies: ${packageStats.dependencies}`);
  console.log(`   DevDependencies: ${packageStats.devDependencies}`);
  console.log(`   Total: ${packageStats.total} packages\n`);
}
```

---

## **What This Does:**

1. ✅ **Scans all TypeScript files** in your component
2. ✅ **Detects npm package imports** (e.g., `import * as THREE from 'three'`)
3. ✅ **Filters package.json** to include:
   - Core Angular packages (always included)
   - Packages used by your component
   - Essential dev dependencies (@angular/cli, typescript, etc.)
   - @types packages for TypeScript definitions
4. ✅ **Creates a clean package.json** with only necessary packages
5. ✅ **Removes unused dependencies** from your main project

---

## **Example Output:**
```
📦 Detecting npm packages...
✓ Found 3 npm packages

📦 Creating filtered package.json...
✓ Filtered package.json created:
   Dependencies: 12
   DevDependencies: 5
   Total: 17 packages
If your component uses Three.js, the filtered package.json will include:

✅ three (detected from imports)
✅ @types/three (automatically included)
✅ Core Angular packages
✅ Essential dev tools

Unused packages from your main project will NOT be included! 🎉RetryPwhile trying to run/serve the code from the auto created repository, it shows the below error on 'ng serve'Error: Could not find the '@angular/build:dev-server' builder's node package.This error means the filtered package.json is missing the @angular-devkit/build-angular package. Let me fix the filtering logic:

Update the createFilteredPackageJson() Function
Replace the essentialDevDeps section with this expanded list:
javascript// Always include essential devDependencies
const essentialDevDeps = [
  '@angular-devkit/build-angular',
  '@angular/cli',
  '@angular/compiler-cli',
  '@angular-devkit/core',
  '@angular-devkit/schematics',
  '@schematics/angular',
  'typescript',
  '@types/node',
  'ts-node'
];

essentialDevDeps.forEach(pkg => {
  if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[pkg]) {
    filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
  }
});

// Also copy all @angular-devkit packages to be safe
if (originalPackageJson.devDependencies) {
  Object.keys(originalPackageJson.devDependencies).forEach(pkg => {
    if (pkg.startsWith('@angular-devkit/') || pkg.startsWith('@schematics/')) {
      filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
    }
  });
}

Alternative: Copy All DevDependencies (Safer Approach)
If you want to avoid missing build tools, replace the devDependencies section with:
javascript// Copy ALL devDependencies (safer for build tools)
if (originalPackageJson.devDependencies) {
  filteredPackageJson.devDependencies = { ...originalPackageJson.devDependencies };
}

Or: Only Filter Regular Dependencies
Keep all devDependencies, only filter regular dependencies:
javascript// Filter package.json to only include used dependencies
function createFilteredPackageJson(tempDir, usedPackages) {
  const originalPackageJsonPath = path.join(process.cwd(), 'package.json');
  const destPackageJsonPath = path.join(tempDir, 'package.json');
  
  if (!fs.existsSync(originalPackageJsonPath)) {
    console.warn('⚠️  package.json not found!');
    return;
  }
  
  const originalPackageJson = JSON.parse(fs.readFileSync(originalPackageJsonPath, 'utf8'));
  
  // Create filtered package.json
  const filteredPackageJson = {
    name: originalPackageJson.name,
    version: originalPackageJson.version || '1.0.0',
    scripts: originalPackageJson.scripts || {},
    private: originalPackageJson.private || true,
    dependencies: {},
    devDependencies: originalPackageJson.devDependencies || {} // COPY ALL devDependencies
  };
  
  // Always include core Angular packages
  const corePackages = [
    '@angular/animations',
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
    'rxjs',
    'tslib',
    'zone.js'
  ];
  
  // Combine core packages with used packages
  const allRequiredPackages = [...new Set([...corePackages, ...usedPackages])];
  
  // Filter ONLY dependencies (not devDependencies)
  allRequiredPackages.forEach(pkg => {
    if (originalPackageJson.dependencies && originalPackageJson.dependencies[pkg]) {
      filteredPackageJson.dependencies[pkg] = originalPackageJson.dependencies[pkg];
    }
  });
  
  // Write filtered package.json
  fs.writeFileSync(destPackageJsonPath, JSON.stringify(filteredPackageJson, null, 2));
  
  return {
    total: Object.keys(filteredPackageJson.dependencies).length + Object.keys(filteredPackageJson.devDependencies).length,
    dependencies: Object.keys(filteredPackageJson.dependencies).length,
    devDependencies: Object.keys(filteredPackageJson.devDependencies).length
  };
}

Recommended Approach:
Keep ALL devDependencies, only filter regular dependencies - this ensures all Angular build tools work correctly while still removing unused runtime packages.
This way:

✅ ng serve will work (all build tools present)
✅ ng build will work
✅ Only runtime dependencies are filtered
✅ DevDependencies stay complete (safe for tooling)

Replace the entire createFilteredPackageJson() function with the "Only Filter Regular Dependencies" version above.



could you not include the readme.md file that is inside the component, to be present inside the component files of the repository. Let the README file be present only at the base project level and not copy them to components/[component-name]/ folder.

Got it! Update the copyDirectory() function to skip README.md files when copying the component:

Replace the copyDirectory() Function
javascript// Utility: Copy directory recursively (skip README.md inside components)
function copyDirectory(src, dest, skipReadme = false) {
  if (!fs.existsSync(src)) {
    console.warn(`   ⚠️  Source does not exist: ${src}`);
    return;
  }
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    // Skip README.md if skipReadme flag is true
    if (skipReadme && entry.name.toLowerCase() === 'readme.md') {
      continue;
    }
    
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, skipReadme);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

Update Step 9 (Copy Component)
Change the component copy call to skip README.md:
javascript// Step 9: Copy component directory (skip README.md inside component)
console.log(`📦 Copying ${componentName} component...`);
const componentSrc = path.join(process.cwd(), 'src', 'app', 'components', componentName);
const componentDest = path.join(tempDir, 'src', 'app', 'components', componentName);

copyDirectory(componentSrc, componentDest, true); // true = skip README.md

if (fs.existsSync(componentDest)) {
  const copiedFiles = fs.readdirSync(componentDest);
  console.log(`✓ Component copied successfully! (${copiedFiles.length} files)\n`);
} else {
  throw new Error('Failed to copy component');
}

Result:
✅ README.md from src/app/components/word-cloud/README.md will be used for the base project level README
✅ README.md will NOT be copied into src/app/components/word-cloud/ in the repository
✅ Only one README.md at the root level




I'm still seeing that error 
Error: Could not find the '@angular/build:dev-server' builder's node package.

I did not include all dev dependencies because that would be unnecessary but basic dev dependencies for running angular project must be included.


The issue is that @angular/build:dev-server is part of @angular/build package (not @angular-devkit/build-angular in newer Angular versions).

Updated Essential Dev Dependencies List
Replace the essentialDevDeps array with this comprehensive list:
javascript// Always include essential devDependencies for Angular to run
const essentialDevDeps = [
  // Angular Build Tools
  '@angular-devkit/build-angular',
  '@angular/build',
  '@angular/cli',
  '@angular/compiler-cli',
  
  // Schematics
  '@angular-devkit/core',
  '@angular-devkit/schematics',
  '@schematics/angular',
  
  // TypeScript
  'typescript',
  '@types/node',
  
  // Testing (optional but often needed)
  'jasmine-core',
  '@types/jasmine',
  'karma',
  'karma-jasmine',
  'karma-chrome-launcher',
  'karma-jasmine-html-reporter',
  'karma-coverage',
  
  // Build tools
  '@angular-devkit/architect',
  'esbuild',
  'vite'
];

essentialDevDeps.forEach(pkg => {
  if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[pkg]) {
    filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
  }
});

// Also include all @angular-devkit/* and @angular/* packages from devDependencies
if (originalPackageJson.devDependencies) {
  Object.keys(originalPackageJson.devDependencies).forEach(pkg => {
    if (pkg.startsWith('@angular-devkit/') || 
        pkg.startsWith('@angular/') || 
        pkg.startsWith('@schematics/')) {
      filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
    }
  });
}

Complete Updated createFilteredPackageJson() Function
javascript// Filter package.json to only include used dependencies
function createFilteredPackageJson(tempDir, usedPackages) {
  const originalPackageJsonPath = path.join(process.cwd(), 'package.json');
  const destPackageJsonPath = path.join(tempDir, 'package.json');
  
  if (!fs.existsSync(originalPackageJsonPath)) {
    console.warn('⚠️  package.json not found!');
    return;
  }
  
  const originalPackageJson = JSON.parse(fs.readFileSync(originalPackageJsonPath, 'utf8'));
  
  // Create filtered package.json
  const filteredPackageJson = {
    name: originalPackageJson.name,
    version: originalPackageJson.version || '1.0.0',
    scripts: originalPackageJson.scripts || {},
    private: originalPackageJson.private || true,
    dependencies: {},
    devDependencies: {}
  };
  
  // Always include core Angular packages
  const corePackages = [
    '@angular/animations',
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic',
    '@angular/router',
    'rxjs',
    'tslib',
    'zone.js'
  ];
  
  // Combine core packages with used packages
  const allRequiredPackages = [...new Set([...corePackages, ...usedPackages])];
  
  // Filter dependencies
  allRequiredPackages.forEach(pkg => {
    if (originalPackageJson.dependencies && originalPackageJson.dependencies[pkg]) {
      filteredPackageJson.dependencies[pkg] = originalPackageJson.dependencies[pkg];
    }
  });
  
  // Always include essential devDependencies for Angular to run
  const essentialDevDeps = [
    // Angular Build Tools
    '@angular-devkit/build-angular',
    '@angular/build',
    '@angular/cli',
    '@angular/compiler-cli',
    
    // Schematics
    '@angular-devkit/core',
    '@angular-devkit/schematics',
    '@schematics/angular',
    
    // TypeScript
    'typescript',
    '@types/node',
    
    // Testing (optional but often needed)
    'jasmine-core',
    '@types/jasmine',
    'karma',
    'karma-jasmine',
    'karma-chrome-launcher',
    'karma-jasmine-html-reporter',
    'karma-coverage',
    
    // Build tools
    '@angular-devkit/architect',
    'esbuild',
    'vite'
  ];
  
  essentialDevDeps.forEach(pkg => {
    if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[pkg]) {
      filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
    }
  });
  
  // Also include ALL @angular-devkit/*, @angular/*, and @schematics/* packages
  if (originalPackageJson.devDependencies) {
    Object.keys(originalPackageJson.devDependencies).forEach(pkg => {
      if (pkg.startsWith('@angular-devkit/') || 
          pkg.startsWith('@angular/') || 
          pkg.startsWith('@schematics/')) {
        filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
      }
    });
  }
  
  // Also include devDependencies for packages used by component
  usedPackages.forEach(pkg => {
    // Check for @types packages
    const typesPackage = `@types/${pkg.replace('@', '').replace('/', '__')}`;
    if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[typesPackage]) {
      filteredPackageJson.devDependencies[typesPackage] = originalPackageJson.devDependencies[typesPackage];
    }
    
    // Check if package itself is in devDependencies
    if (originalPackageJson.devDependencies && originalPackageJson.devDependencies[pkg]) {
      filteredPackageJson.devDependencies[pkg] = originalPackageJson.devDependencies[pkg];
    }
  });
  
  // Write filtered package.json
  fs.writeFileSync(destPackageJsonPath, JSON.stringify(filteredPackageJson, null, 2));
  
  return {
    total: Object.keys(filteredPackageJson.dependencies).length + Object.keys(filteredPackageJson.devDependencies).length,
    dependencies: Object.keys(filteredPackageJson.dependencies).length,
    devDependencies: Object.keys(filteredPackageJson.devDependencies).length
  };
}

Key Changes:

✅ Added @angular/build package (for newer Angular versions)
✅ Automatically includes ALL @angular-devkit/* packages from devDependencies
✅ Automatically includes ALL @angular/* packages from devDependencies
✅ Includes esbuild and vite (used by modern Angular builds)
✅ Includes testing packages (karma, jasmine)


After Updating:

Run the deployment script again
In the new repository, run:

bash   npm install
   ng serve
This should now work without the @angular/build:dev-server error! 🎉





is it possible to copy the component folder inside the folder /src/app/components/ , but while creating repository place the component folder inside /src/app/ folder instead and update all the references accordingly in the remote repository files?

Yes, absolutely possible! We need to:

✅ Copy component from src/app/components/[component-name]/
✅ Place it in src/app/[component-name]/ in the repository
✅ Update all import paths that reference the component
✅ Update app routing/config files if they reference the component path


Add This Function to deploy-component.js
javascript// Update import paths in files to reflect new component location
function updateImportPaths(tempDir, componentName) {
  console.log('🔧 Updating import paths...');
  
  let filesUpdated = 0;
  
  function updateFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const ext = path.extname(filePath);
    if (!['.ts', '.js', '.html'].includes(ext)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Update imports from components/[name] to just [name]
    // Pattern 1: from 'app/components/component-name'
    content = content.replace(
      new RegExp(`from ['"](.*)app/components/${componentName}(.*)['"]`, 'g'),
      `from '$1app/${componentName}$2'`
    );
    
    // Pattern 2: from './components/component-name'
    content = content.replace(
      new RegExp(`from ['"]\\.\\.?/components/${componentName}(.*)['"]`, 'g'),
      `from './${componentName}$1'`
    );
    
    // Pattern 3: from '../components/component-name'
    content = content.replace(
      new RegExp(`from ['"]\\.\\./components/${componentName}(.*)['"]`, 'g'),
      `from '../${componentName}$1'`
    );
    
    // Pattern 4: Absolute paths with @app or src/app/components
    content = content.replace(
      new RegExp(`(['"])(@app|src/app)/components/${componentName}`, 'g'),
      `$1$2/${componentName}`
    );
    
    // Update templateUrl and styleUrls if they reference component path
    content = content.replace(
      new RegExp(`(['"])\\./components/${componentName}/`, 'g'),
      `$1./${componentName}/`
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesUpdated++;
    }
  }
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and hidden folders
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          scanDirectory(fullPath);
        }
      } else {
        updateFile(fullPath);
      }
    }
  }
  
  scanDirectory(tempDir);
  
  console.log(`✓ Updated import paths in ${filesUpdated} files\n`);
  return filesUpdated;
}

Update Step 9 in deployComponent() Function
Replace Step 9 with this updated version:
javascript// Step 9: Copy component directory to src/app/ (not src/app/components/)
console.log(`📦 Copying ${componentName} component...`);
const componentSrc = path.join(process.cwd(), 'src', 'app', 'components', componentName);
const componentDest = path.join(tempDir, 'src', 'app', componentName); // NOTE: Changed destination

copyDirectory(componentSrc, componentDest, true); // true = skip README.md

if (fs.existsSync(componentDest)) {
  const copiedFiles = fs.readdirSync(componentDest);
  console.log(`✓ Component copied to src/app/${componentName}/ (${copiedFiles.length} files)\n`);
} else {
  throw new Error('Failed to copy component');
}

Add Import Path Update After Copying Dependencies
After Step 10 (Copy dependencies), add this:
javascript// Step 10: Copy dependencies
const depsCount = copyDependencies(tempDir, manualDeps, autoDetected);
console.log(`✓ Copied ${depsCount} dependencies\n`);

// NEW: Update import paths throughout the project
updateImportPaths(tempDir, componentName);

Update detectImports() Function
Update the import detection to handle the new structure:
javascript// Auto-detect imports from TypeScript files
function detectImports(componentPath) {
  const detected = {
    services: new Set(),
    components: new Set(),
    models: new Set(),
    shared: new Set()
  };
  
  function scanFile(filePath) {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.ts')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+{[^}]*}\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip external packages
      if (!importPath.startsWith('.') && !importPath.startsWith('@angular')) {
        continue;
      }
      
      // Convert relative imports to absolute paths
      if (importPath.startsWith('.')) {
        const dir = path.dirname(filePath);
        const absolutePath = path.resolve(dir, importPath);
        const relativePath = path.relative(process.cwd(), absolutePath);
        
        // Categorize by path
        if (relativePath.includes('services')) {
          detected.services.add(relativePath);
        } else if (relativePath.includes('models')) {
          detected.models.add(relativePath);
        } else if (relativePath.includes('shared')) {
          detected.shared.add(relativePath);
        } else if (relativePath.includes('components') && !relativePath.includes(path.basename(componentPath))) {
          // Other components (not the main one being deployed)
          detected.components.add(relativePath);
        }
      }
    }
  }
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        scanFile(fullPath);
      }
    }
  }
  
  scanDirectory(componentPath);
  
  return {
    services: Array.from(detected.services),
    components: Array.from(detected.components),
    models: Array.from(detected.models),
    shared: Array.from(detected.shared)
  };
}

Update copyDependencies() Function
Update the component copying section to use the new path:
javascript// Copy other components (to src/app/ not src/app/components/)
if (allDeps.components.length > 0) {
  console.log('  🧩 Related Components:');
  allDeps.components.forEach(comp => {
    const srcPath = path.join(process.cwd(), comp);
    
    // Extract component name from path and place in src/app/
    const componentName = path.basename(comp);
    const destPath = path.join(tempDir, 'src', 'app', componentName);
    
    if (fs.existsSync(srcPath)) {
      copyDirectory(srcPath, destPath, true); // Skip README.md
      console.log(`    ✓ ${componentName}/ (placed in src/app/)`);
      copiedCount++;
    }
  });
  console.log();
}
```

---

## **What This Does:**

1. ✅ **Component location**: Copies from `src/app/components/word-cloud/` to `src/app/word-cloud/`
2. ✅ **Updates imports**: Automatically updates all import statements throughout the codebase
3. ✅ **Handles patterns**:
   - `from 'app/components/word-cloud'` → `from 'app/word-cloud'`
   - `from './components/word-cloud'` → `from './word-cloud'`
   - `from '../components/word-cloud'` → `from '../word-cloud'`
4. ✅ **Related components**: Also moved to `src/app/` (not `src/app/components/`)
5. ✅ **Clean structure**: Repository has flatter structure without extra `components/` folder

---

## **Before (Your Local Project):**
```
src/app/
├── components/
│   └── word-cloud/
│       ├── word-cloud.component.ts
│       └── ...
```

## **After (Remote Repository):**
```
src/app/
├── word-cloud/
│   ├── word-cloud.component.ts
│   └── ...
All import paths automatically updated! 🎉