# Contributing to Angular Component Deployment Automation Tool

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Legal Requirements](#legal-requirements)
- [Questions](#questions)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by [creating an issue](https://github.com/kash-pram/compo-to-repo-tool/issues).

## Getting Started

### Prerequisites

Before contributing, ensure you have:

* Node.js v20.19 or higher
* GitHub CLI (`gh`) installed and authenticated
* Angular CLI v20 or higher
* Git configured with your GitHub account
* Read and understood the [DISCLAIMER](../DISCLAIMER.md) and [LICENSE](../LICENSE)

### First Contributions

Good first issues are labeled as `good-first-issue` in our issue tracker. These are great starting points for new contributors.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When reporting bugs, include:**

* **Clear Title**: Descriptive summary of the issue
* **Steps to Reproduce**: Detailed steps to reproduce the behavior
* **Expected Behavior**: What you expected to happen
* **Actual Behavior**: What actually happened
* **Environment**:
  - Node.js version (`node --version`)
  - Angular version (`ng version`)
  - GitHub CLI version (`gh --version`)
  - Operating system and version
* **Logs**: Relevant error messages or console output
* **Screenshots**: If applicable
* **Component Details**: Type of component being deployed (if relevant)

**Security Vulnerabilities**: Please review our [Security Policy](SECURITY.md) before reporting security issues.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

* **Clear Use Case**: Describe the problem this enhancement would solve
* **Proposed Solution**: How you envision the feature working
* **Alternatives Considered**: Other solutions you've thought about
* **Implementation Ideas**: Technical approach (if you have thoughts)
* **Breaking Changes**: Whether this would break existing functionality

### Contributing Code

1. **Fork the Repository**
```bash
   gh repo fork kash-pram/compo-to-repo-tool --clone
   cd compo-to-repo-tool
```

2. **Create a Branch**
```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
```

3. **Make Your Changes**
   * Write clear, readable code
   * Follow existing code style
   * Add comments for complex logic
   * Update documentation as needed

4. **Test Your Changes**
```bash
   # Test with a simple component
   node deploy-component.js
   
   # Verify the deployed repository works
   # Check GitHub Actions workflow completes successfully
   # Verify GitHub Pages if applicable
```

5. **Commit Your Changes**
```bash
   git add .
   git commit -m "feat: add feature description"
   # or
   git commit -m "fix: fix bug description"
```

   **Commit Message Format**:
```
   type: subject line (max 50 chars)
   
   Body explaining what and why (wrap at 72 chars)
   
   Fixes #issue-number (if applicable)
```

   **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

6. **Push to Your Fork**
```bash
   git push origin feature/your-feature-name
```

7. **Create a Pull Request**
   * Go to the original repository
   * Click "New Pull Request"
   * Select your fork and branch
   * Fill out the PR template completely

## Development Setup

### Clone and Install
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/compo-to-repo-tool.git
cd compo-to-repo-tool

# Install dependencies
npm install

# Configure your GitHub username
# Edit deploy-config.json and update "githubUsername"
```

### Testing Your Changes
```bash
# Create a test component
# Place it in src/app/components/test-component/

# Run the deployment tool
node deploy-component.js

# Input:
# - Component name: test-component
# - Repository name: test-deployment-YYYYMMDD
# - Visibility: public
# - Description: Testing changes

# Verify:
# 1. Repository created successfully
# 2. All files copied correctly
# 3. GitHub Actions workflow runs
# 4. GitHub Pages deploys (for public repos)
# 5. Deployed site works correctly

# Clean up test repository after verification
gh repo delete YOUR_USERNAME/test-deployment-YYYYMMDD
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated (README, code comments)
- [ ] Changes tested with multiple component types
- [ ] No new warnings or errors introduced
- [ ] Commit messages follow the format
- [ ] PR description is complete and clear

### PR Requirements

Your pull request must:

1. **Pass Automated Checks**: If CI/CD is set up, all checks must pass
2. **Include Tests**: Add tests for new functionality where applicable
3. **Update Documentation**: README, code comments, or docs/ files as needed
4. **Maintain Compatibility**: No breaking changes without discussion
5. **Follow Legal Requirements**: See below

### Review Process

1. Maintainers will review your PR within 1-2 weeks
2. Reviewers may request changes or ask questions
3. Address feedback by pushing new commits to your branch
4. Once approved, a maintainer will merge your PR
5. Your contribution will be included in the next release

## Coding Standards

### JavaScript/Node.js Style

* Use **2 spaces** for indentation
* Use **single quotes** for strings
* Use **semicolons** at the end of statements
* Use **camelCase** for variables and functions
* Use **PascalCase** for classes
* Use **UPPER_CASE** for constants
* Maximum line length: **100 characters**

### Best Practices

* **DRY**: Don't Repeat Yourself - extract common logic into functions
* **KISS**: Keep It Simple, Stupid - avoid unnecessary complexity
* **Error Handling**: Always use try-catch for operations that can fail
* **Logging**: Use descriptive console messages with appropriate emoji
* **Comments**: Explain why, not what (code should be self-explanatory)

### Example
```javascript
// Good
function copyDocumentationFiles(tempDir) {
  console.log('📄 Copying documentation files...');
  let copiedCount = 0;
  
  try {
    config.documentationFiles.forEach(file => {
      const srcPath = path.join(process.cwd(), file);
      const destPath = path.join(tempDir, file);
      
      if (copyFile(srcPath, destPath)) {
        console.log(`   ✓ ${file}`);
        copiedCount++;
      }
    });
    
    return copiedCount;
  } catch (error) {
    console.error('❌ Failed to copy documentation files:', error.message);
    throw error;
  }
}

// Bad
function copy(d) {
  var c=0;
  for(var i=0;i<config.documentationFiles.length;i++){
    var f=config.documentationFiles[i]
    // copy file
    c++
  }
  return c
}
```

## Testing Guidelines

### Manual Testing Checklist

Test your changes with:

- [ ] Simple standalone component (no dependencies)
- [ ] Component with external npm dependencies (e.g., three.js)
- [ ] Component with internal dependencies (services, models)
- [ ] Component with assets (images, fonts)
- [ ] Public repository creation
- [ ] Private repository creation
- [ ] Multiple components from the same project

### Edge Cases to Test

* Component names with hyphens and underscores
* Very long component names
* Components with many dependencies
* Components with circular dependencies
* Large components (>100 files)
* Network interruptions during deployment
* Invalid component names
* Missing required files

## Legal Requirements

### Code Ownership

By contributing, you agree that:

1. **You Own the Code**: You have the right to contribute the code
2. **License Grant**: Your contributions will be licensed under the MIT License
3. **No Confidential Information**: You're not including proprietary or confidential information
4. **Third-Party Code**: Any third-party code is properly attributed and compatible with MIT License

### Developer Certificate of Origin

By making a contribution, you certify that:
```
Developer Certificate of Origin
Version 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the MIT license; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution is maintained
    indefinitely and may be redistributed.
```

### Prohibited Contributions

Do NOT contribute:

* Code copied from proprietary sources
* Code that infringes on patents or copyrights
* Malicious code or security vulnerabilities
* Personal data or credentials
* Code that violates GitHub's Terms of Service
* Code designed to bypass security measures

## Questions?

* **General Questions**: [Create a discussion](https://github.com/kash-pram/compo-to-repo-tool/discussions)
* **Bug Reports**: [Create an issue](https://github.com/kash-pram/compo-to-repo-tool/issues)
* **Security Issues**: See [SECURITY.md](SECURITY.md)

## Recognition

Contributors will be:

* Listed in release notes
* Acknowledged in the README (for significant contributions)
* Credited in commit history

## License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](../LICENSE).

---

**Thank you for contributing to make this tool better!** 🎉