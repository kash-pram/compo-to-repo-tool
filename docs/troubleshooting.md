### Getting Help

- 📖 [Angular Documentation](https://angular.io/docs)
- 🐙 [GitHub CLI Documentation](https://cli.github.com/manual/)
- 💬 [Open an Issue](https://github.com/kash-pram/compo-to-repo-tool/issues)

### Useful Links

- **GitHub CLI Docs**: https://cli.github.com/manual/
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Angular Docs**: https://angular.dev

### Useful Commands

```bash
# Check versions
node --version
npm --version
ng --version
gh --version

# Verify GitHub authentication
gh auth status

# List your repositories
gh repo list

# View deployment logs
npm run deploy-component 2>&1 | tee deploy.log

# Clean npm cache
npm cache clean --force
```

---


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

---

## ❓ FAQ

### Can I deploy multiple components at once?
No, the tool deploys one component at a time. Run it multiple times for different components.

### Will this work with Angular 17/18/19?
The tool is designed for Angular 20+ but may work with 17-19. Test thoroughly.

### Can I deploy to a different branch name?
No, it always uses `gh-pages`. This is the GitHub Pages standard.

### What happens to my original component?
Nothing. The tool copies files - your original component remains unchanged.

### Can I customize the generated README?
Yes! Add a `README.md` file inside your component folder. The tool will use it instead of auto-generating one.

### Does this work with GitHub Enterprise?
It should work if GitHub CLI is properly configured for your enterprise instance.

### What if I need a custom build process?
You can modify the GitHub Actions workflow in the deployed repo's `.github/workflows/deploy.yml`.

### Can I deploy from a monorepo?
Yes, as long as components are in `src/app/components/`.

---

## Common known issues and it's solution

### Why GitHub Pages Deployment Sometimes Fails

**Root Causes:**

**1. Permissions Issues (Most Common)**
- GitHub Actions doesn't have write permissions by default on new repos
- The `GITHUB_TOKEN` needs explicit permissions to create branches

**2. Build Failures**
- Missing dependencies not detected by auto-detection
- TypeScript compilation errors
- Path resolution issues in the new structure

**3. Timing Issues**
- GitHub API takes time to propagate repository settings
- Workflow might start before repo is fully initialized

**4. API Rate Limits**
- GitHub CLI/API calls can hit rate limits
- Especially if deploying multiple components quickly

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

### Issue 3.5: Private Repository and GitHub Pages

**Symptom:** Created private repo but want GitHub Pages

**Limitation:** GitHub Pages requires public repositories on free accounts.

**Solution:**

**Option 1: Make Repository Public**
1. Go to: `https://github.com/your-username/repo-name/settings`
2. Scroll to "Danger Zone"
3. Click "Change visibility" → "Change to public"
4. Confirm the change
5. Go to: `https://github.com/your-username/repo-name/settings/pages`
6. Source: "Deploy from a branch"
7. Branch: `gh-pages` / `/ (root)`
8. Click Save

**Option 2: Use GitHub Pro/Team Account**
- Upgrade to GitHub Pro for private repo Pages support
- Cost: $4/month per user
- Go to: https://github.com/settings/billing

**Option 3: Deploy Elsewhere**
- Use Netlify, Vercel, or Cloudflare Pages (support private repos)
- Connect your private GitHub repo
- These services can build from private repositories

**What the Tool Already Set Up:**
- ✅ GitHub Actions workflow (ready to work when public)
- ✅ Proper build configuration
- ✅ gh-pages branch will be created on first workflow run

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


#### ❌ Error: `gh: command not found`

**Problem:** GitHub CLI not installed

**Solution:**
```bash
# Windows
winget install --id GitHub.cli

# Mac
brew install gh

# Linux
sudo apt install gh

# Then authenticate
gh auth login
```

#### ❌ Error: `Component not found in src/app/components/`

**Problem:** Component in wrong location

**Solution:**
```bash
# Check current location
ls src/app/components/

# Move component if needed
mv src/app/my-component src/app/components/my-component
```

#### ❌ Error: `Could not find '@angular/build:dev-server'`

**Problem:** Missing Angular build packages

**Solution:** The script now auto-includes these. Update your script:
```bash
# Pull latest changes
git pull origin main

# Re-run deployment
npm run deploy-component
```

#### ❌ Error: `ng serve` fails in deployed repository

**Problem:** Missing dependencies after deployment

**Solution:**
```bash
cd deployed-repo-folder
npm install
ng serve
```

#### ❌ Error: Import paths not working

**Problem:** Paths not updated correctly

**Solution:** Check the console output during deployment. If paths weren't updated, the component may use dynamic imports. Add to `dependencies.json`:

```json
{
  "dependencies": {
    "services": ["src/app/services/your-service.ts"]
  }
}
```

#### ❌ GitHub Pages shows 404

**Problem:** GitHub Pages not configured

**Solution:**
```bash
# Go to repository settings on GitHub
# Pages → Source → gh-pages branch → Save

# Or use GitHub CLI
gh repo edit --enable-pages --pages-branch gh-pages
```

#### ❌ Live demo shows blank page

**Problem:** Base href not set correctly

**Solution:** Check `angular.json` in deployed repo:
```json
{
  "projects": {
    "your-app": {
      "architect": {
        "build": {
          "options": {
            "baseHref": "/repository-name/"
          }
        }
      }
    }
  }
}
```