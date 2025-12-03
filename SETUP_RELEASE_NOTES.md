# Release Notes Automation Setup

## What Was Done

I've integrated the Linear release notes generator into your existing CI/CD pipeline that runs on tag creation. Here's what was added:

### 1. Script Integration in `.github/workflows/build.yml`

**Added step "Generate Release Notes"** (lines 144-149):
- Runs only on Ubuntu runner (to avoid duplication)
- Only executes when a tag is pushed
- Generates release notes from the last tag to the current tag
- Saves output to `RELEASE_NOTES.md`

**Modified step "Release"** (lines 163-171):
- Added `body_path: RELEASE_NOTES.md` to include release notes in GitHub release
- Added `fail_on_unset_body: false` to gracefully handle missing file on other platforms

### 2. The Complete Flow

When you push a new tag (e.g., `v0.51.19-alpha`):

1. CI workflow triggers on all three platforms (macOS, Ubuntu, Windows)
2. Ubuntu runner generates release notes by:
   - Fetching commits since the last tag
   - Extracting Linear task IDs (e.g., `JS-8441`)
   - Calling Linear API to get task details
   - Formatting release notes in Markdown
3. All platforms build and create artifacts
4. The GitHub release is created with:
   - Build artifacts from all platforms
   - Release notes (if Ubuntu runner completes successfully)

## Setup Required

### Add LINEAR_API_KEY to GitHub Secrets

1. **Get your Linear API Key:**
   - Go to https://linear.app/settings/api
   - Click "Create new key"
   - Give it a descriptive name like "GitHub Actions - Anytype Release Notes"
   - Copy the key (starts with `lin_api_...`)

2. **Add to GitHub Secrets:**
   - Go to your repository: https://github.com/anyproto/anytype-ts
   - Navigate to: Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `LINEAR_API_KEY`
   - Value: Paste your Linear API key
   - Click "Add secret"

### Verify Setup

After adding the secret, the next time you push a tag, the CI will automatically:
- Generate release notes from Linear tasks
- Include them in the GitHub release

## Testing

### Test Locally (Before Pushing a Tag)

You can test the script locally to verify it works:

```bash
# Set your Linear API key
export LINEAR_API_KEY="lin_api_xxxxxxxxxxxxx"

# Test with the last two tags
npm run release:notes -- --from v0.51.17-alpha --to v0.51.18-alpha

# Or test from last tag to current HEAD
npm run release:notes
```

### Test in CI (After Setup)

1. Create and push a test tag:
   ```bash
   git tag v0.51.19-alpha
   git push origin v0.51.19-alpha
   ```

2. Watch the workflow run:
   - Go to Actions tab in GitHub
   - Click on the "Release" workflow
   - Monitor the "Generate Release Notes" step on the Ubuntu runner

3. Check the release:
   - Go to Releases in your repository
   - Open the newly created release
   - Verify that release notes are populated with Linear task details

## Troubleshooting

### Release notes are empty or missing

**Cause:** LINEAR_API_KEY not set or invalid

**Solution:**
- Verify the secret is correctly set in GitHub
- Check the Linear API key hasn't expired
- Look at the CI logs for the "Generate Release Notes" step

### Script fails with "No changes in this release"

**Cause:** No commits between the tags, or tags not found

**Solution:**
- This is normal if there are no commits between tags
- Verify tags exist: `git tag --list`
- Check commits: `git log --oneline v0.51.17-alpha..v0.51.18-alpha`

### Linear tasks not showing up

**Cause:** Commit messages don't include Linear IDs

**Solution:**
- Ensure commits follow format: `JS-1234: Description`
- The pattern is case-sensitive: `[TEAM]-[NUMBER]`
- Multiple IDs in one commit are supported

### Script times out or API errors

**Cause:** Too many Linear API calls or rate limiting

**Solution:**
- Linear API has rate limits
- If you have many commits/tasks, the script might take longer
- Check Linear API status: https://status.linear.app

## Commit Message Best Practices

To ensure the release notes are comprehensive:

### ✅ Good Examples
```
JS-1234: Add dark mode support
JS-5678: Fix memory leak in editor
JS-9012: Update dependencies (also fixes JS-9013)
```

### ❌ Bad Examples
```
fix bug                    # No Linear ID
WIP                        # No Linear ID
JS1234: fix               # Missing hyphen
update stuff              # No Linear ID
```

## Release Notes Format

The generated release notes will look like this:

```markdown
# Release Notes: v0.51.19-alpha

Changes from v0.51.18-alpha to v0.51.19-alpha

Generated: 2025-12-02T10:00:00.000Z

## 🔴 Urgent

### JS-8441: Fix critical authentication bug
Brief description from Linear...
**Details:** Status: Done | Assignee: John Doe
**Commits:**
- `de7281a` JS-8441: fix

## 🟠 High Priority
...

## 📝 Other Commits
- `153c1a9` fix crash
```

## Files Modified

1. `.github/workflows/build.yml` - Added release notes generation step
2. `package.json` - Added `release:notes` script
3. `scripts/generate-release-notes.js` - Main script (new)
4. `scripts/README.md` - Documentation (new)
5. `.env.example` - Environment template (new)

## Next Steps

1. ✅ Add `LINEAR_API_KEY` to GitHub Secrets (required)
2. ✅ Push a test tag to verify it works
3. ✅ Review the generated release notes
4. ✅ Adjust commit message format if needed

## Support

For issues or questions:
- Script documentation: `scripts/README.md`
- Test locally: `npm run release:notes -- --help`
- Check CI logs in GitHub Actions

---

**Note:** The release notes generation only runs on tag pushes (not on regular commits). The script is completely optional - if LINEAR_API_KEY is not set, the release will still be created, just without the enhanced release notes.
