# How to Change Git Repository

## Current Situation
Your project is currently connected to a Git repository (likely your ERP website repo) and you're working in a branch. You want to move this to a completely new repository.

## Step-by-Step Guide

### Option 1: Keep Git History (Recommended)

This preserves all your commit history in the new repository.

#### Step 1: Create a new repository on GitHub
1. Go to https://github.com/new
2. Create a new repository (e.g., `my-vidyon-app`)
3. **Do NOT initialize** with README, .gitignore, or license
4. Copy the new repository URL (e.g., `https://github.com/yourusername/my-vidyon-app.git`)

#### Step 2: Change the remote URL
```bash
# Navigate to your project directory
cd c:\Users\DELL\Downloads\myvidyon-app-v1\my-vidyon

# View current remote
git remote -v

# Remove the old remote
git remote remove origin

# Add the new remote
git remote add origin https://github.com/yourusername/my-vidyon-app.git

# Verify the new remote
git remote -v
```

#### Step 3: Push to the new repository
```bash
# Push your current branch to the new repo
git push -u origin main

# Or if you're on a different branch (e.g., 'app-branch')
git push -u origin app-branch

# Push all branches (optional)
git push --all origin

# Push all tags (optional)
git push --tags origin
```

---

### Option 2: Fresh Start (No History)

This creates a completely fresh repository without any previous commit history.

#### Step 1: Create a new repository on GitHub
1. Go to https://github.com/new
2. Create a new repository (e.g., `my-vidyon-app`)
3. **Do NOT initialize** with README, .gitignore, or license
4. Copy the new repository URL

#### Step 2: Remove existing Git history
```bash
# Navigate to your project directory
cd c:\Users\DELL\Downloads\myvidyon-app-v1\my-vidyon

# Remove the .git folder (this deletes all Git history)
Remove-Item -Recurse -Force .git

# Initialize a new Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: My Vidyon ERP App"
```

#### Step 3: Connect to new repository
```bash
# Add the new remote
git remote add origin https://github.com/yourusername/my-vidyon-app.git

# Push to the new repository
git push -u origin main
```

---

## Important Files to Check Before Pushing

### 1. Create/Update `.gitignore`
Make sure you're not committing sensitive files:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Environment variables
.env
.env.local
.env.production
.env.development

# Supabase
.supabase/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
```

### 2. Remove sensitive data
Before pushing, make sure to remove:
- API keys
- Database passwords
- Supabase service role keys
- Any production credentials

Check these files:
- `.env` files
- Configuration files
- Any hardcoded credentials in the code

---

## Verification Steps

After changing the repository:

```bash
# 1. Check remote URL
git remote -v
# Should show your new repository URL

# 2. Check current branch
git branch
# Should show your current branch with an asterisk

# 3. Check status
git status
# Should show "Your branch is up to date with 'origin/main'"

# 4. View commit history
git log --oneline
# Should show your commits
```

---

## Troubleshooting

### Issue: "Permission denied" when pushing
**Solution**: Make sure you're authenticated with GitHub
```bash
# Use GitHub CLI
gh auth login

# Or configure Git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Issue: "Repository not found"
**Solution**: Check the repository URL is correct
```bash
git remote set-url origin https://github.com/yourusername/correct-repo-name.git
```

### Issue: "Failed to push some refs"
**Solution**: Pull first if the remote has changes
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

---

## Recommended Approach

I recommend **Option 1** (Keep Git History) because:
- ✅ Preserves your development history
- ✅ Easier to track changes
- ✅ Can revert to previous versions if needed
- ✅ Shows your work progression

Use **Option 2** (Fresh Start) only if:
- ❌ You want to hide previous commits
- ❌ The old repo has sensitive data in history
- ❌ You want a clean slate

---

## Next Steps After Changing Repository

1. **Update your team** (if any) about the new repository URL
2. **Update CI/CD pipelines** if you have any
3. **Update deployment configurations** to pull from the new repo
4. **Archive or delete the old branch** in the original repository (optional)
