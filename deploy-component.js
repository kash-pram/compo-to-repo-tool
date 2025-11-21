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

// Utility: Execute command with retry logic
function execWithRetry(command, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log(`   Retry ${i + 1}/${maxRetries - 1}...`);
      // Wait before retrying (exponential backoff)
      const waitTime = Math.pow(2, i) * 1000;
      
      // Use a blocking sleep
      const start = Date.now();
      while (Date.now() - start < waitTime) {
        // Busy wait
      }
    }
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

// Utility: Copy directory recursively (skip README.md inside components)
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

// Detect npm packages used by component
function detectNpmDependencies(componentPath) {
  const usedPackages = new Set();
  
  function scanFile(filePath) {
    if (!fs.existsSync(filePath) || !filePath.endsWith('.ts')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match ALL import statement patterns
    const patterns = [
      // import { x } from 'package'
      /import\s+{[^}]*}\s+from\s+['"]([^'"]+)['"]/g,
      // import x from 'package'
      /import\s+[\w]+\s+from\s+['"]([^'"]+)['"]/g,
      // import * as x from 'package'
      /import\s+\*\s+as\s+[\w]+\s+from\s+['"]([^'"]+)['"]/g,
      // import 'package'
      /import\s+['"]([^'"]+)['"]/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        
        // Skip relative imports (starting with . or /)
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
          continue;
        }
        
        // Skip @angular packages (already included in core)
        if (importPath.startsWith('@angular')) {
          continue;
        }
        
        // Extract package name (handle scoped packages)
        let packageName;
        if (importPath.startsWith('@')) {
          // Scoped package: @foo/bar -> @foo/bar
          const parts = importPath.split('/');
          packageName = `${parts[0]}/${parts[1]}`;
        } else {
          // Regular package: lodash/get -> lodash
          packageName = importPath.split('/')[0];
        }
        
        usedPackages.add(packageName);
      }
    });
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
  
    // Copy other components (to src/app/ not src/app/components/)
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

function createGitHubPagesWorkflow(tempDir, repoName) {
  const workflowDir = path.join(tempDir, '.github', 'workflows');
  fs.mkdirSync(workflowDir, { recursive: true });
  
  const workflowContent = `name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

# Prevent concurrent deployments
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Check for lock file
        id: check-lock
        run: |
          if [ -f "package-lock.json" ]; then
            echo "LOCK_EXISTS=true" >> $GITHUB_OUTPUT
          else
            echo "LOCK_EXISTS=false" >> $GITHUB_OUTPUT
          fi
      
      - name: Install dependencies (with lock file)
        if: steps.check-lock.outputs.LOCK_EXISTS == 'true'
        run: npm ci
      
      - name: Install dependencies (without lock file)
        if: steps.check-lock.outputs.LOCK_EXISTS == 'false'
        run: npm install
      
      - name: Get project name from angular.json
        id: project-name
        run: |
          PROJECT_NAME=$(node -pe "Object.keys(require('./angular.json').projects)[0]")
          echo "PROJECT_NAME=$PROJECT_NAME" >> $GITHUB_OUTPUT
      
      - name: Build
        run: npm run build -- --configuration production --base-href /${repoName}/
      
      - name: Check for browser folder
        id: check-browser
        run: |
          if [ -d "dist/\${{ steps.project-name.outputs.PROJECT_NAME }}/browser" ]; then
            echo "BUILD_DIR=dist/\${{ steps.project-name.outputs.PROJECT_NAME }}/browser" >> $GITHUB_OUTPUT
          else
            echo "BUILD_DIR=dist/\${{ steps.project-name.outputs.PROJECT_NAME }}" >> $GITHUB_OUTPUT
          fi
      
      - name: Add .nojekyll file
        run: touch \${{ steps.check-browser.outputs.BUILD_DIR }}/.nojekyll
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: \${{ steps.check-browser.outputs.BUILD_DIR }}
          publish_branch: gh-pages
          force_orphan: true
          commit_message: 'Deploy: \${{ github.sha }}'
`;
  
  const workflowPath = path.join(workflowDir, 'deploy.yml');
  fs.writeFileSync(workflowPath, workflowContent);
  
  return workflowPath;
}

// // Configure repository settings for GitHub Actions
// function configureRepositorySettings(repoName) {
//   console.log('⚙️  Configuring repository settings...');
  
//   try {
//     // Enable GitHub Actions with write permissions
//     execSync(
//       `gh api repos/${config.githubUsername}/${repoName} -X PATCH -f allow_auto_merge=false -f delete_branch_on_merge=false`,
//       { encoding: 'utf8', stdio: 'pipe' }
//     );
    
//     // Set default workflow permissions to read-write
//     execSync(
//       `gh api repos/${config.githubUsername}/${repoName}/actions/permissions -X PUT -f default_workflow_permissions=write -f can_approve_pull_request_reviews=false`,
//       { encoding: 'utf8', stdio: 'pipe' }
//     );
    
//     console.log('✓ Repository settings configured\n');
//     return true;
//   } catch (error) {
//     // Silently fail - not critical, workflow will work anyway
//     console.log('✓ Repository settings configured (using defaults)\n');
//     return false;
//   }
// }

function create404Page(tempDir) {
  const indexPath = path.join(tempDir, 'src', 'index.html');
  const dest404Path = path.join(tempDir, 'src', '404.html');
  
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, dest404Path);
    return true;
  }
  return false;
}

function updateAngularJsonForGitHubPages(tempDir, repoName) {
  const angularJsonPath = path.join(tempDir, 'angular.json');
  
  if (!fs.existsSync(angularJsonPath)) {
    console.warn('⚠️  angular.json not found, skipping base href configuration');
    return false;
  }
  
  try {
    const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));
    const projectName = Object.keys(angularJson.projects)[0];
    
    // Add 404.html to assets
    if (!angularJson.projects[projectName].architect.build.options.assets) {
      angularJson.projects[projectName].architect.build.options.assets = [];
    }
    
    const assets = angularJson.projects[projectName].architect.build.options.assets;
    if (!assets.includes('src/404.html')) {
      assets.push('src/404.html');
    }
    
    // Set base href for production
    if (!angularJson.projects[projectName].architect.build.configurations) {
      angularJson.projects[projectName].architect.build.configurations = {};
    }
    
    if (!angularJson.projects[projectName].architect.build.configurations.production) {
      angularJson.projects[projectName].architect.build.configurations.production = {};
    }
    
    angularJson.projects[projectName].architect.build.configurations.production.baseHref = `/${repoName}/`;
    
    fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));
    return true;
  } catch (error) {
    console.warn('⚠️  Error updating angular.json:', error.message);
    return false;
  }
}

// Add this function to update package.json scripts
function addDeployScript(tempDir, repoName) {
  const packageJsonPath = path.join(tempDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add manual deploy script
    packageJson.scripts['deploy:manual'] = `ng build --configuration production --base-href /${repoName}/ && npx gh-pages -d dist/$(node -pe "Object.keys(require('./angular.json').projects)[0]")/browser`;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return true;
  } catch (error) {
    console.warn('⚠️  Error updating package.json scripts:', error.message);
    return false;
  }
}

// Verify build works before pushing
function verifyBuild(tempDir) {
  console.log('🔍 Verifying build configuration...');
  
  const originalDir = process.cwd();
  
  try {
    process.chdir(tempDir);
    
    // Install dependencies
    console.log('   Installing dependencies...');
    execSync('npm install', { encoding: 'utf8', stdio: 'pipe' });
    
    // Try to build
    console.log('   Running test build...');
    execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
    
    console.log('✓ Build verification successful\n');
    
    // Clean up build artifacts
    const distPath = path.join(tempDir, 'dist');
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true });
    }
    
    process.chdir(originalDir);
    return true;
  } catch (error) {
    console.error('❌ Build verification failed!');
    console.error('   Error:', error.message);
    console.error('\n   This means the deployment will fail.');
    console.error('   Please check:');
    console.error('   1. All dependencies are correctly detected');
    console.error('   2. Component has no TypeScript errors');
    console.error('   3. All imports are valid\n');
    
    process.chdir(originalDir);
    return false;
  }
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

  // Step 3.5: Warn about private repo limitations
  if (repoVisibility === 'private') {
    console.log('\n⚠️  IMPORTANT: GitHub Pages Notice');
    console.log('   GitHub Pages is only available for public repositories on free accounts.');
    console.log('   This deployment will:');
    console.log('   ✓ Create the private repository');
    console.log('   ✓ Set up GitHub Actions workflow');
    console.log('   ✓ Create gh-pages branch');
    console.log('   ✓ Skip automatic Pages enablement\n');
    console.log('   To enable Pages later: Make repo public, then manually enable Pages.\n');
    
    const proceed = await question('   Continue with private repository? (yes/no) [yes]: ');
    if (proceed.trim().toLowerCase() === 'no') {
      console.log('\n❌ Deployment cancelled by user.\n');
      rl.close();
      process.exit(0);
    }
  }

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
    
    // Validate component has required files
    console.log('🔍 Validating component structure...');
    const componentFiles = fs.readdirSync(componentPath);
    const hasTsFile = componentFiles.some(f => f.endsWith('.ts'));

    if (!hasTsFile) {
      console.error('❌ No TypeScript file found in component!');
      console.error('   Component must have at least a .ts file');
      process.exit(1);
    }

    console.log('✓ Component structure valid\n');

    console.log('📦 Detecting npm packages...');
    const usedPackages = detectNpmDependencies(componentPath);
    console.log(`✓ Found ${usedPackages.length} npm packages\n`);

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

    try {
      execWithRetry(createCommand);
      console.log('✓ Repository created successfully!\n');
    } catch (error) {
      console.error('❌ Failed to create repository after retries');
      throw error;
    }
    
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
    
    console.log('📦 Creating filtered package.json...');
    const packageStats = createFilteredPackageJson(tempDir, usedPackages);
    
    // console.log('🔒 Generating package-lock.json...');
    // const originalDir = process.cwd(); // Save original directory
    
    // try {
    //   process.chdir(tempDir);
    //   exec('npm install --package-lock-only', { stdio: 'pipe' });
    //   console.log('✓ package-lock.json generated\n');
    // } catch (error) {
    //   console.warn('⚠️  Could not generate package-lock.json');
    //   console.warn('   Workflow will use npm install instead of npm ci\n');
    // } finally {
    //   // Always return to original directory, even if error occurs
    //   process.chdir(originalDir);
    // }

    console.log('ℹ️  package-lock.json will be generated by GitHub Actions on first build\n');

    if (packageStats) {
        console.log(`✓ Filtered package.json created:`);
        console.log(`   Dependencies: ${packageStats.dependencies}`);
        console.log(`   DevDependencies: ${packageStats.devDependencies}`);
        console.log(`   Total: ${packageStats.total} packages\n`);
    }

    // Step 9: Copy component directory to src/app/ (not src/app/components/)
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
    
    // Step 10: Copy dependencies
    const depsCount = copyDependencies(tempDir, manualDeps, autoDetected);
    console.log(`✓ Copied ${depsCount} dependencies\n`);

    // NEW: Update import paths throughout the project
    updateImportPaths(tempDir, componentName);

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
    
    // Step 11.5: Copy documentation files
    if (config.documentationFiles && config.documentationFiles.length > 0) {
      console.log('📄 Copying documentation files...');
      let docsCount = 0;
      
      config.documentationFiles.forEach(file => {
        const srcPath = path.join(process.cwd(), file);
        const destPath = path.join(tempDir, file);
        
        if (copyFile(srcPath, destPath)) {
          console.log(`   ✓ ${file}`);
          docsCount++;
        }
      });
      
      if (docsCount > 0) {
        console.log(`✓ Copied ${docsCount} documentation file(s)\n`);
      } else {
        console.log('⚠️  No documentation files found to copy\n');
      }
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
    
    // Step 12.5: Setup GitHub Pages (if enabled)
    if (config.githubPages && config.githubPages.enabled) {
      console.log('🌐 Setting up GitHub Pages...\n');
      
      // Create GitHub Actions workflow
      if (config.githubPages.createWorkflow) {
        console.log('📝 Creating GitHub Actions workflow...');
        createGitHubPagesWorkflow(tempDir, repoName);
        console.log('✓ Workflow created at .github/workflows/deploy.yml\n');
      }
      
      // Create 404.html
      if (config.githubPages.create404) {
        console.log('📄 Creating 404.html...');
        if (create404Page(tempDir)) {
          console.log('✓ 404.html created\n');
        } else {
          console.log('⚠️  Could not create 404.html\n');
        }
      }
      
      // Update angular.json
      console.log('⚙️  Updating angular.json for GitHub Pages...');
      if (updateAngularJsonForGitHubPages(tempDir, repoName)) {
        console.log('✓ angular.json updated with base href and 404.html\n');
      } else {
        console.log('⚠️  Could not update angular.json\n');
      }
      
      // Add deploy script
      console.log('📜 Adding deployment script to package.json...');
      if (addDeployScript(tempDir, repoName)) {
        console.log('✓ Deploy script added (npm run deploy:manual)\n');
      } else {
        console.log('⚠️  Could not add deploy script\n');
      }
      
      // NEW: Verify build before pushing
      console.log('🔨 Running build verification (this may take 1-2 minutes)...\n');
      const buildSuccess = verifyBuild(tempDir);
      
      if (!buildSuccess) {
        console.error('❌ Build verification failed!');
        console.error('   Deployment aborted to prevent broken repository.\n');
        
        // Cleanup
        const currentDir = process.cwd();
        if (currentDir.includes('temp-deploy')) {
          process.chdir('..');
        }
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        
        // Delete the created repository
        console.log('🗑️  Cleaning up: Deleting created repository...');
        try {
          execSync(`gh repo delete ${config.githubUsername}/${repoName} --yes`, { stdio: 'pipe' });
          console.log('✓ Repository deleted\n');
        } catch (error) {
          console.warn('⚠️  Could not delete repository automatically');
          console.warn(`   Please delete manually: https://github.com/${config.githubUsername}/${repoName}/settings\n`);
        }
        
        process.exit(1);
      }
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

    // // NEW: Configure repository settings
    // if (config.githubPages && config.githubPages.enabled) {
    //   configureRepositorySettings(repoName);
    // }
    
    // Repository settings are configured automatically by GitHub
    // Manual configuration only needed if workflow fails
    // configureRepositorySettings(repoName);
    
    // Step 13.5: Auto-enable GitHub Pages after workflow completes
    if (config.githubPages && config.githubPages.enabled && repoVisibility === 'public') {
      console.log('🌐 Setting up GitHub Pages automation...\n');
      
      const pagesUrl = `https://${config.githubUsername}.github.io/${repoName}/`;
      
      console.log('⏳ Waiting for GitHub Actions to complete and create gh-pages branch...');
      console.log('   Checking every 15 seconds (max 5 minutes)...\n');
      
      // Function to check workflow status
      function checkWorkflowStatus() {
        try {
          const result = execWithRetry(  // USE execWithRetry
            `gh run list --repo ${config.githubUsername}/${repoName} --limit 1 --json status,conclusion`,
            { encoding: 'utf8', stdio: 'pipe' },
            2  // Only 2 retries for status checks
          );
          const runs = JSON.parse(result);
          if (runs.length > 0) {
            return runs[0];
          }
        } catch (error) {
          return null;
        }
        return null;
      }
      
      // Function to check if gh-pages branch exists
      function ghPagesBranchExists() {
        try {
          execWithRetry(  // USE execWithRetry
            `gh api repos/${config.githubUsername}/${repoName}/branches/gh-pages`,
            { encoding: 'utf8', stdio: 'pipe' },
            2
          );
          return true;
        } catch {
          return false;
        }
      }
      
      // Function to enable GitHub Pages
      function enablePages() {
        try {
          execWithRetry(  // USE execWithRetry
            `gh api repos/${config.githubUsername}/${repoName}/pages -X POST -f source[branch]=gh-pages -f source[path]=/`,
            { encoding: 'utf8', stdio: 'pipe' },
            3  // 3 retries for critical API call
          );
          return true;
        } catch (error) {
          return false;
        }
      }
      
      // Polling function
      let attempts = 0;
      const maxAttempts = 20; // 5 minutes (20 * 15 seconds)
      
      const pollInterval = setInterval(() => {
        attempts++;
        
        const workflowStatus = checkWorkflowStatus();
        
        if (workflowStatus && workflowStatus.status === 'completed') {
          if (workflowStatus.conclusion === 'success') {
            process.stdout.write(' ✓\n');
            console.log('✓ GitHub Actions workflow completed successfully!\n');
            
            console.log('🔍 Checking for gh-pages branch...');
            if (ghPagesBranchExists()) {
              console.log('✓ gh-pages branch exists!\n');
              
              console.log('🌐 Enabling GitHub Pages...');
              if (enablePages()) {
                clearInterval(pollInterval);
                console.log('✓ GitHub Pages enabled successfully!\n');
                console.log('═══════════════════════════════════════');
                console.log(`🎉 Your site is live at: ${pagesUrl}`);
                console.log('   (May take 1-2 more minutes to be fully available)');
                console.log('═══════════════════════════════════════\n');
                finishDeployment();
              } else {
                clearInterval(pollInterval);
                console.log('⚠️  Could not auto-enable GitHub Pages.\n');
                provideFallbackInstructions(repoUrl, repoName, pagesUrl);  // USE provideFallbackInstructions
                finishDeployment();
              }
            } else {
              clearInterval(pollInterval);
              console.log('⚠️  gh-pages branch not found after workflow completion.\n');
              provideFallbackInstructions(repoUrl, repoName, pagesUrl);  // USE provideFallbackInstructions
              finishDeployment();
            }
          } else {
            clearInterval(pollInterval);
            process.stdout.write(' ✗\n');
            console.log(`✗ Workflow failed with conclusion: ${workflowStatus.conclusion}\n`);
            console.log(`   Check workflow logs: ${repoUrl}/actions\n`);
            provideFallbackInstructions(repoUrl, repoName, pagesUrl);  // USE provideFallbackInstructions
            finishDeployment();
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          process.stdout.write(' ⏱️\n');
          console.log('\n⏱️  Timeout: Workflow is taking longer than expected.\n');
          provideFallbackInstructions(repoUrl, repoName, pagesUrl);  // USE provideFallbackInstructions
          finishDeployment();
        } else {
          // Show progress
          process.stdout.write('.');
        }
      }, 15000); // Check every 15 seconds
      
      function finishDeployment() {
        // Step 14: Cleanup
        const currentDir = process.cwd();
        if (currentDir.includes('temp-deploy')) {
          process.chdir('..');
        }
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        console.log('✓ Cleanup complete!\n');
        
        // Success message
        printSuccessMessage();
      }
      
      // Don't continue until polling completes
      return;
    }
    
    // If private repo, skip Pages enablement but inform user
    if (config.githubPages && config.githubPages.enabled && repoVisibility === 'private') {
      console.log('ℹ️  GitHub Pages setup skipped (private repository)\n');
      console.log('   GitHub Actions workflow and gh-pages branch will be created.');
      console.log('   To enable Pages later:');
      console.log(`   1. Make repository public: ${repoUrl}/settings`);
      console.log(`   2. Go to: ${repoUrl}/settings/pages`);
      console.log('   3. Source: "Deploy from a branch"');
      console.log('   4. Branch: "gh-pages" / "/ (root)"');
      console.log('   5. Click "Save"\n');
    }

    // If GitHub Pages not enabled, continue normally
    process.chdir('..');
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete!\n');
    printSuccessMessage();
    
    function printSuccessMessage() {
      console.log('🎉 SUCCESS! Deployment completed!\n');
      console.log('═══════════════════════════════════════');
      console.log(`📦 Component: ${componentName}`);
      console.log(`🔗 Repository: ${repoUrl}`);
      console.log(`👁️  Visibility: ${repoVisibility}`);
      console.log(`📊 Dependencies: ${depsCount} items`);
      
      if (config.githubPages && config.githubPages.enabled) {
        if (repoVisibility === 'public') {
          console.log(`🌐 GitHub Pages: Enabled`);
          console.log(`🔗 Site URL: https://${config.githubUsername}.github.io/${repoName}/`);
          console.log(`⚙️  Auto-deploy: On push to main branch`);
          console.log(`🛠️  Manual deploy: npm run deploy:manual`);
        } else {
          console.log(`🌐 GitHub Pages: Not enabled (private repository)`);
          console.log(`📋 Workflow: Ready (will work when repo is public)`);
          console.log(`⚙️  gh-pages branch: Will be created on first workflow run`);
        }
      }
      
      console.log('═══════════════════════════════════════\n');
    }
    
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

// Update import paths in files to reflect new component location
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

// Provide fallback instructions when automation fails
function provideFallbackInstructions(repoUrl, repoName, pagesUrl) {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  ⚠️  AUTOMATED GITHUB PAGES SETUP INCOMPLETE                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('The repository was created successfully, but GitHub Pages');
  console.log('needs to be set up manually. Follow these steps:\n');
  
  console.log('📋 MANUAL SETUP STEPS:\n');
  
  console.log('Step 1: Configure Workflow Permissions');
  console.log(`   → Go to: ${repoUrl}/settings/actions`);
  console.log('   → Under "Workflow permissions", select:');
  console.log('     ✓ "Read and write permissions"');
  console.log('   → Click "Save"\n');
  
  console.log('Step 2: Trigger Workflow');
  console.log(`   → Go to: ${repoUrl}/actions`);
  console.log('   → Click "Deploy to GitHub Pages" workflow');
  console.log('   → Click "Run workflow" → "Run workflow"');
  console.log('   → Wait 1-2 minutes for completion\n');
  
  console.log('Step 3: Enable GitHub Pages');
  console.log(`   → Go to: ${repoUrl}/settings/pages`);
  console.log('   → Source: "Deploy from a branch"');
  console.log('   → Branch: "gh-pages" / "/ (root)"');
  console.log('   → Click "Save"\n');
  
  console.log('Step 4: Access Your Site');
  console.log(`   → Wait 1-2 minutes for deployment`);
  console.log(`   → Visit: ${pagesUrl}\n`);
  
  console.log('💡 TIP: If workflow fails, check the Actions tab for error details.\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run the deployment
deployComponent();