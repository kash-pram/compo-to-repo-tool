# Angular Component Deployment Tool - Quick Start Guide

This guide will help you set up and run the Angular project with component deployment automation.

---

## Prerequisites Installation

### 1. Install Node.js and npm

**Windows:**
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer (includes npm)
3. Verify installation:
```bash
node --version
npm --version
```

**Mac:**
```bash
# Using Homebrew
brew install node

# Verify
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
# Using apt
sudo apt update
sudo apt install nodejs npm

# Verify
node --version
npm --version
```

---

### 2. Install Git

**Windows:**
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer
3. Verify:
```bash
git --version
```

**Mac:**
```bash
# Using Homebrew
brew install git

# Verify
git --version
```

**Linux:**
```bash
sudo apt install git

# Verify
git --version
```

**Configure Git:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

### 3. Install GitHub CLI

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
# Ubuntu/Debian
sudo apt install gh

# Or using snap
sudo snap install gh
```

**Verify Installation:**
```bash
gh --version
```

---

### 4. Authenticate GitHub CLI

Run the authentication command:
```bash
gh auth login
```

Follow the interactive prompts:
```
? What account do you want to log into? 
> GitHub.com

? What is your preferred protocol for Git operations?
> HTTPS

? Authenticate Git with your GitHub credentials? 
> Yes

? How would you like to authenticate GitHub CLI?
> Login with a web browser
```

**Steps:**
1. Copy the one-time code shown
2. Press Enter to open GitHub in your browser
3. Paste the code
4. Click "Authorize GitHub CLI"
5. Done!

**Verify Authentication:**
```bash
gh auth status
```

You should see:
```
✓ Logged in to github.com as your-username
```

---

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kash-pram/compo-to-repo-tool.git
cd compo-to-repo-tool
```

---

### 2. Install Dependencies

```bash
npm install
```

This will install all Angular dependencies and required packages.

---

### 3. Configure GitHub Username

Open `deploy-config.json` and update your GitHub username:

```json
{
  "githubUsername": "your-github-username"
}
```

Replace `"your-github-username"` with your actual GitHub username.

---

## Running the Angular Project

### Development Server

Start the Angular development server:

```bash
npm start
```

Or:

```bash
ng serve
```

The application will be available at: **http://localhost:4200/**

### Build for Production

```bash
npm run build
```

Or:

```bash
ng build
```

Build artifacts will be stored in the `dist/` directory.

---

## Using the Deployment Tool

### Deploy a Component to GitHub

Run the deployment script:

```bash
npm run deploy-component
```

### Interactive Prompts

You'll be asked to provide:

```
📦 Component name (e.g., my-component): [Enter your component name]
📝 New repository name: [Enter desired repository name]
🔒 Repository visibility (public/private) [public]: [Press Enter for public or type 'private']
📄 Repository description (optional): [Enter a description or press Enter to skip]
```

### Example Usage

```bash
npm run deploy-component

📦 Component name: my-button
📝 New repository name: custom-button-component
🔒 Repository visibility: public
📄 Repository description: Reusable button component

⚙️ Starting deployment process...

🔍 Analyzing dependencies...
✓ Using auto-detection

📦 Detecting npm packages...
✓ Found 3 npm packages

📦 Creating GitHub repository...
✓ Repository created successfully!

🔗 Repository URL: https://github.com/your-username/custom-button-component

📋 Copying base Angular files...
✓ Copied 15 base files

📦 Copying my-button component...
✓ Component copied successfully!

📦 Copying dependencies...
✓ Copied 5 dependencies

🔧 Updating import paths...
✓ Updated import paths in 8 files

📦 Creating filtered package.json...
✓ Filtered package.json created

📝 Processing README.md...
✓ Generated default README.md

🔧 Initializing Git repository...
📤 Pushing to GitHub...
✓ Pushed successfully!

🎉 SUCCESS! Deployment completed!
```

---

## Project Structure

```
compo-to-repo-tool/
├── src/
│   ├── app/
│   │   ├── components/          ← Your components go here
│   │   │   ├── component-1/
│   │   │   ├── component-2/
│   │   │   └── component-3/
│   │   ├── services/            ← Shared services
│   │   ├── models/              ← Data models
│   │   ├── shared/              ← Shared utilities
│   │   └── app.component.ts
│   ├── main.ts
│   ├── index.html
│   └── styles.css
├── deploy-component.js          ← Deployment script
├── deploy-config.json           ← Configuration file
├── package.json
├── angular.json
└── README.md
```

---

## Adding Your Own Components

### 1. Create a Component

```bash
ng generate component components/my-component
```

This creates:
```
src/app/components/my-component/
├── my-component.component.ts
├── my-component.component.html
├── my-component.component.css
└── my-component.component.spec.ts
```

### 2. Add Component README (Optional)

Create `README.md` inside your component folder:

**File:** `src/app/components/my-component/README.md`

```markdown
# My Component

Description of your component.

## Features
- Feature 1
- Feature 2

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
ng serve
\`\`\`
```

### 3. Add Dependencies File (Optional)

If your component has specific dependencies, create `dependencies.json`:

**File:** `src/app/components/my-component/dependencies.json`

```json
{
  "component": "my-component",
  "description": "My custom component",
  "dependencies": {
    "services": [
      "src/app/services/data.service.ts"
    ],
    "models": [
      "src/app/models/app.model.ts"
    ],
    "sharedModules": [
      "src/app/shared/utils.ts"
    ]
  }
}
```

---

## Troubleshooting

### Error: `gh: command not found`

**Solution:**
```bash
# Reinstall GitHub CLI
winget install --id GitHub.cli  # Windows
brew install gh                 # Mac

# Then authenticate
gh auth login
```

### Error: `npm: command not found`

**Solution:** Node.js is not installed or not in PATH. Reinstall Node.js from [nodejs.org](https://nodejs.org/)

### Error: `Component not found`

**Solution:** 
- Check that your component is in `src/app/components/[component-name]/`
- Verify the component name matches the folder name
- Run `ls src/app/components/` to see available components

### Error: `ng: command not found`

**Solution:**
```bash
# Install Angular CLI globally
npm install -g @angular/cli

# Or use npx
npx ng serve
```

### Error: Port 4200 already in use

**Solution:**
```bash
# Use a different port
ng serve --port 4300

# Or kill the process using port 4200
# Windows:
netstat -ano | findstr :4200
taskkill /PID [PID] /F

# Mac/Linux:
lsof -ti:4200 | xargs kill
```

### GitHub Authentication Issues

**Solution:**
```bash
# Check authentication status
gh auth status

# Re-authenticate if needed
gh auth login

# Refresh token
gh auth refresh
```

---

## Common Commands

### Angular Development

```bash
# Start development server
npm start
# or
ng serve

# Build for production
npm run build
# or
ng build

# Run tests
npm test
# or
ng test

# Generate a new component
ng generate component components/new-component

# Generate a service
ng generate service services/new-service
```

### Deployment

```bash
# Deploy a component
npm run deploy-component

# Check GitHub authentication
gh auth status

# List your GitHub repositories
gh repo list
```

### Git Commands

```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

---

## Tips for Success

### 1. Component Organization
- Keep components in `src/app/components/`
- One component per folder
- Name folders in `kebab-case`

### 2. Testing Before Deployment
```bash
# Test your component locally first
ng serve
# Open http://localhost:4200/
```

### 3. Dependency Management
- Use `dependencies.json` for complex dependencies
- The tool auto-detects most dependencies
- Check console output for detected dependencies

### 4. Repository Naming
- Use descriptive names
- Follow `kebab-case` convention
- Examples: `user-profile`, `data-table`, `custom-button`

### 5. Regular Updates
```bash
# Keep dependencies updated
npm update

# Update Angular CLI
npm install -g @angular/cli@latest
```

---

## What Gets Deployed

When you run `npm run deploy-component`, the tool:

✅ Creates a new GitHub repository  
✅ Copies base Angular files (package.json, angular.json, tsconfig, etc.)  
✅ Copies your component from `src/app/components/[name]/`  
✅ Places it in `src/app/[name]/` in the new repository  
✅ Auto-detects and copies all dependencies (services, models, shared modules)  
✅ Filters package.json to include only necessary packages  
✅ Updates all import paths from `components/[name]` to `[name]`  
✅ Adds README (uses component README or generates default)  
✅ Pushes everything to GitHub  

---

## Support

### Getting Help

1. **Check the Troubleshooting section** above
2. **Verify installations:**
   ```bash
   node --version
   npm --version
   git --version
   gh --version
   ```
3. **Check GitHub authentication:**
   ```bash
   gh auth status
   ```
4. **Review console output** for specific error messages

### Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Angular Documentation](https://angular.io/docs)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Git Documentation](https://git-scm.com/doc)

---

## Quick Reference

### Installation Checklist

- [ ] Node.js and npm installed
- [ ] Git installed and configured
- [ ] GitHub CLI installed
- [ ] GitHub CLI authenticated
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] GitHub username configured in `deploy-config.json`

### First Deployment Checklist

- [ ] Angular project runs (`npm start`)
- [ ] Component exists in `src/app/components/`
- [ ] Component README created (optional)
- [ ] Dependencies file created (optional)
- [ ] Run `npm run deploy-component`
- [ ] Follow interactive prompts
- [ ] Verify repository created on GitHub

---

## Next Steps

1. **Explore the Project**
   ```bash
   npm start
   # Open http://localhost:4200/
   ```

2. **Create Your First Component**
   ```bash
   ng generate component components/my-first-component
   ```

3. **Deploy It**
   ```bash
   npm run deploy-component
   ```

4. **Share Your Repository**
   - Your new repository will be at: `https://github.com/your-username/repo-name`
   - Share the link with others
   - They can clone and use your component

---

## License

MIT License - Free to use in your projects.

---

**Happy Coding! 🚀**
