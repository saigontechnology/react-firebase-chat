# Release Guide

This document outlines the process for releasing the `@saigontechnology/react-firebase-chat` package to npm.

## Prerequisites

1. Ensure you're logged in to npm: `npm whoami`
2. If not logged in: `npm login`
3. Ensure you have the necessary permissions to publish to the `@saigontechnology` scope

## Release Scripts

The package.json includes several convenient release scripts:

### Testing the Release

Before publishing, always run a dry-run to see what will be published:

```bash
npm run dry-run
```

This will show you exactly what files and content will be included in the npm package.

### Release Types

#### Patch Release (1.0.0 → 1.0.1)
For bug fixes and small updates:
```bash
npm run release:patch
```

#### Minor Release (1.0.0 → 1.1.0)
For new features that don't break existing functionality:
```bash
npm run release:minor
```

#### Major Release (1.0.0 → 2.0.0)
For breaking changes:
```bash
npm run release:major
```

#### Beta Release
For pre-release versions:
```bash
npm run release:beta
```

## Manual Release Process

If you prefer to control each step manually:

1. **Update the version:**
   ```bash
   npm version patch  # or minor/major
   ```

2. **Build the package:**
   ```bash
   npm run build
   ```

3. **Test the build:**
   ```bash
   npm run dry-run
   ```

4. **Publish to npm:**
   ```bash
   npm publish
   ```

## Pre-release Checklist

Before releasing, ensure:

- [ ] All changes are documented in CHANGELOG.md
- [ ] Version number follows semantic versioning
- [ ] Package builds successfully (`npm run build`)
- [ ] All TypeScript files compile without errors
- [ ] README.md is up to date
- [ ] License file exists and is correct

## Post-release

After publishing:

1. **Create a GitHub release** with the same version tag
2. **Update the README** if needed
3. **Notify team members** of the new release
4. **Update dependent projects** that use this package

## Troubleshooting

### Permission Issues
If you get permission errors, ensure:
- You're logged in to the correct npm account
- Your account has access to the `@saigontechnology` organization
- The package name is correct in package.json

### Build Issues
If the build fails:
- Check TypeScript compilation errors
- Ensure all dependencies are installed
- Verify PostCSS configuration is working

### Publishing Issues
- Double-check the package name and version
- Ensure you're not trying to republish the same version
- Check npm registry status

## Package Information

- **Package Name:** `@saigontechnology/react-firebase-chat`
- **Registry:** https://registry.npmjs.org/
- **Scope:** @saigontechnology
- **Access:** Public