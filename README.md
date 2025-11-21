# Angular Component Deployment Automation Tool

This tool takes a single Angular component from your project and deploys it to a new GitHub repository with full GitHub Pages support, including automatic CI/CD via GitHub Actions.

**Ready to revolutionize your component workflow? Let's go! 🚀**

```bash
git clone https://github.com/kash-pram/compo-to-repo-tool.git
cd compo-to-repo-tool
npm install
npm run deploy-component
```

**Your components. Deployed. In minutes.**

✨ **Generate** components using AI tools like Claude, ChatGPT, or Cursor  
📦 **Integrate** those components seamlessly into a pre-configured Angular base  
🚀 **Deploy** individual components to separate GitHub repositories with GitHub Pages enabled  
🎨 **Showcase** each component as a standalone demo with zero manual configuration

---

## ⚠️ Important Legal Notice

**READ BEFORE USE**: This tool performs automated GitHub operations that can create, modify, and deploy code. 

- 📄 [LICENSE](./LICENSE) - MIT License terms
- ⚠️ [DISCLAIMER](./DISCLAIMER.md) - **REQUIRED READING** - Liability and risk warnings
- 📋 [NOTICE](./NOTICE.md) - Third-party attributions and dependencies
- 🔒 [SECURITY](./SECURITY.md) - Security considerations and best practices

**BY USING THIS TOOL, YOU ACCEPT ALL RISKS AND RESPONSIBILITIES.** The authors provide NO WARRANTY and accept NO LIABILITY for any damages or losses.

Always test in a safe environment first with test repositories.

---

# Angular Component Deployment Automation Tool

**Automate the deployment of Angular components to GitHub with automatic GitHub Pages setup.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen)](https://nodejs.org/)
[![Angular Version](https://img.shields.io/badge/angular-%3E%3D20-red)](https://angular.dev/)
[![GitHub CLI](https://img.shields.io/badge/GitHub_CLI-required-blue)](https://cli.github.com/)

---

## 📋 Table of Contents

- [Purpose](#purpose-)
- [Prerequisites](#prerequisites-)
- [Checklist](#checklist-)
- [Setup](#setup-)
- [Workflow - Tips](#workflow-)
- [Configuration - File Structure - Customization](#configuration-️---file-structure----customization-)
- [Troubleshooting](#troubleshooting-)

---

## Purpose 🎯

Generate components using AI, drop them into this Angular base project, install the dependencies, and deploy to GitHub Pages with a single command. No more manual repository setup, dependency hunting, or configuration headaches.

```
┌──────────────────────┐          ┌──────────────────────┐
│  Base Angular        │          │  Component(s)        │
│  Project             │          │  (Ready to deploy)   │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                 │
           └────────────┬────────────────────┘
                        │
                        ▼
           ┌────────────────────────────────┐
           │  Deployment Automation Tool    │
           └────────────┬───────────────────┘
                        │
                        ▼
           ┌────────────────────────────────┐
           │  Repository per component      │
           │  (GitHub Pages enabled)        │
           └────────────────────────────────┘
```

### The Problem It Solves

**Before:**
```
1. Create component with AI ⏰ 2 minutes
2. Set up new Angular project ⏰ 10 minutes
3. Install dependencies manually ⏰ 5 minutes
4. Create GitHub repository ⏰ 3 minutes
5. Configure GitHub Pages ⏰ 5 minutes
6. Fix import paths ⏰ 10 minutes
7. Deploy and debug ⏰ 15 minutes
────────────────────────────────────────
Total: 50 minutes per component 😫
```

**After (with this tool):**
```
1. Generate component with AI ⏰ 2 minutes
2. Drop into src/app/components/ ⏰ 30 seconds
3. Run: npm run deploy-component ⏰ 2 minutes
────────────────────────────────────────
Total: 5 minutes per component 🎉
Live demo at: your-username.github.io/component-name
```

**Use Cases:**
- Sharing components as live demos
- Creating portfolio projects
- Component library showcases
- Client demonstrations

---

## Prerequisites 📦

![Angular](https://img.shields.io/badge/Angular-20-red?style=flat-square&logo=angular) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript) ![Node.js](https://img.shields.io/badge/Node.js-16+-green?style=flat-square&logo=node.js) ![GitHub CLI](https://img.shields.io/badge/GitHub_CLI-2.0+-black?style=flat-square&logo=github)


## Prerequisites

### ⚠️ BEFORE YOU START - MANDATORY READING

**YOU MUST:**
1. ✅ Read the [DISCLAIMER](./DISCLAIMER.md) in full
2. ✅ Understand the risks (data loss, public exposure, etc.)
3. ✅ Have a backup of your code
4. ✅ Test with non-sensitive code first
5. ✅ Use a test GitHub account initially

**By proceeding, you acknowledge you have read and accept all terms in the DISCLAIMER.**



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


### Prerequisites

Install these tools once (skip if already installed):

```bash
# 1. Node.js and npm
node --version  # Should show v16+
npm --version

# 2. Git
git --version

# 3. GitHub CLI
gh --version

# 4. Authenticate GitHub CLI
gh auth login
```

### Repository Requirements
(if not using the project from this repository)

- ✅ Angular 20+ project (might work in older versions too)
- ✅ Components located in `src/app/components/`
- ✅ Git initialized
- ✅ GitHub account

---

## Checklist 🔥 

- [ ] Node.js 16+ installed
- [ ] Git installed and configured
- [ ] GitHub CLI installed (`gh`)
- [ ] GitHub CLI authenticated (`gh auth login`)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `deploy-config.json` configured with your GitHub username
- [ ] First component ready in `src/app/components/`
- [ ] Run `npm run deploy-component`
- [ ] Celebrate! 🎉


### ✅ Pre-Deployment Checklist

Before running the tool, verify:

- [ ] GitHub CLI installed and authenticated (`gh auth status`)
- [ ] Node.js v20.19+ installed (`node --version`)
- [ ] Component exists in `src/app/components/[name]/`
- [ ] Component has all necessary files (.ts, .html, .css)
- [ ] `deploy-config.json` has your GitHub username
- [ ] You're in the Angular project root directory
- [ ] Component builds successfully in your project (`ng serve`)

---

## Setup 🚀

### [To setup the code files]

### Method 1: Using this repository (Base Angular Project + Deployment Automation Script & Config)

```bash
# 1. Clone this repository
git clone https://github.com/kash-pram/compo-to-repo-tool.git
cd compo-to-repo-tool

# 2. Install dependencies
npm install

# 3. Configure your GitHub username
# Edit deploy-config.json and replace "your-github-username"
nano deploy-config.json  # or use any editor

# 4. Test the Angular app
npm start 
```

### Method 2: Using your own existing Angular project as the base Angular project

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

## [Execute the automation script - to deploy the component to Github]

```bash
# Run the deployment command
npm run deploy-component
```

### 🚦 Post-Deployment Checklist

After running the tool, verify:

- [ ] GitHub repository created successfully
- [ ] GitHub Actions workflow completed (check Actions tab)
- [ ] gh-pages branch exists in repository
- [ ] GitHub Pages is enabled (Settings → Pages)
- [ ] Site is live and accessible
- [ ] All component features work correctly
- [ ] No console errors on deployed site


You'll know deployment succeeded when you see:

**For Public Repository:**
```
🎉 SUCCESS! Deployment completed!

═══════════════════════════════════════
📦 Component: word-cloud
🔗 Repository: https://github.com/user/word-cloud-demo
👁️  Visibility: public
📊 Dependencies: 5 items
📄 Documentation: 5 files copied
🌐 GitHub Pages: Enabled
🔗 Site URL: https://user.github.io/word-cloud-demo/
⚙️  Auto-deploy: On push to main branch
🛠️  Manual deploy: npm run deploy:manual
═══════════════════════════════════════
```

Visit the site URL to see your deployed component live! 🚀


**For Private Repository:**
```
🎉 SUCCESS! Deployment completed!

═══════════════════════════════════════
📦 Component: word-cloud-private
🔗 Repository: https://github.com/user/word-cloud-private
👁️  Visibility: private
📊 Dependencies: 5 items
📄 Documentation: 5 files copied
🌐 GitHub Pages: Not enabled (private repository)
📋 Workflow: Ready (will work when repo is public)
⚙️  gh-pages branch: Will be created on first workflow run
═══════════════════════════════════════
```

---

## Safety Checklist Before Deployment

Before running `npm run deploy-component`, verify:

- [ ] Backed up your source code
- [ ] Reviewed component for sensitive data (API keys, secrets, credentials)
- [ ] Tested with a dummy component first
- [ ] Using appropriate repository visibility (public/private)
- [ ] Understand GitHub costs (if using private repos)
- [ ] Component contains no proprietary code (if deploying publicly)
- [ ] Import paths can be safely modified
- [ ] Dependencies are correctly identified
- [ ] Have necessary rights to deploy this code

---

## Workflow 🔍

Please refer to the **[workflow](docs/workflow.md)** and **[tips](docs/tips.md)** document.

---

## Configuration ⚙️ - File Structure 📁 - Customization 🎨

Please refer to the **[configurations](docs/configurations.md)** document.

---

## Troubleshooting 🔧

Please refer to the **[troubleshooting](docs/troubleshooting.md)** document.

---

## 📝 Notes

- **Build Time**: First deployment takes 2-4 minutes
- **Subsequent Deploys**: Pushing to main branch auto-deploys (1-2 min)
- **Rate Limits**: GitHub API has rate limits; avoid rapid deployments
- **Storage**: Each repo counts toward your GitHub storage quota
- **Private Repos**: Private repos on free accounts have limited Actions minutes

---

## 🙏 Acknowledgments

Built with:
- ❤️ **Angular** - The best framework for building web apps
- 🎨 **Three.js** - For amazing 3D visualizations
- 🤖 **AI Tools** - ChatGPT, Claude, Cursor for component generation
- 🐙 **GitHub CLI** - For seamless GitHub integration
- 🚀 **GitHub Pages** - For free hosting

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for full terms.

### Important License Terms

**Key Points:**
- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ⚠️ **NO WARRANTY** - Use at your own risk
- ⚠️ **NO LIABILITY** - Authors not responsible for damages
- 📋 Must include copyright notice and license in copies

**Required Attributions:**
- See [NOTICE.md](./NOTICE.md) for third-party dependencies
- See [DISCLAIMER.md](./DISCLAIMER.md) for full terms

### Your Responsibilities When Using This Tool

You are responsible for:
- Legal compliance in your jurisdiction
- Intellectual property rights
- Security of deployed code
- Costs incurred from GitHub operations
- Any damages or losses from tool usage

For detailed terms, read the [LICENSE](./LICENSE), [DISCLAIMER](./DISCLAIMER.md), and [SECURITY](./SECURITY.md) files.

## ⚠️ Important Legal Information

### Disclaimer

**USE AT YOUR OWN RISK**

This tool is provided "as is" without warranty of any kind. Before using this tool, please read:
- [LICENSE](./LICENSE) - MIT License terms
- [DISCLAIMER.md](./DISCLAIMER.md) - Complete terms of use and liability limitations
- [SECURITY.md](./SECURITY.md) - Security considerations and best practices
- [NOTICE](./NOTICE) - Third-party software notices

### Critical Warnings

⚠️ **BACKUP YOUR CODE**: Always backup your code before using this tool  
⚠️ **REVIEW BEFORE PUSHING**: Review all generated files before making repositories public  
⚠️ **NO SECRETS**: Never include API keys, passwords, or credentials in your code  
⚠️ **IRREVERSIBLE**: Repository creation and code pushing cannot be easily undone  
⚠️ **YOUR RESPONSIBILITY**: You are solely responsible for what you deploy  

### User Responsibilities

You are responsible for:
- Ensuring you have legal rights to deploy all code
- Verifying compliance with all applicable licenses
- Following your organization's policies
- Protecting sensitive information
- Complying with GitHub's Terms of Service and API policies
- Creating backups before use
- Testing in a safe environment first
- Reviewing all files before pushing to public repositories

### Support and Liability

- **No Warranty**: This software comes with absolutely no warranty
- **No Liability**: Authors are not liable for any damages or issues
- **Community Support**: Support is community-based via GitHub issues
- **Security Issues**: Report privately (see SECURITY.md)

For complete terms, see [DISCLAIMER.md](./DISCLAIMER.md).

---

**Happy Coding! 🌐**