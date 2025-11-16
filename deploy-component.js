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

// Run the deployment
deployComponent();