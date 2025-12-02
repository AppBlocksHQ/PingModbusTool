# GitHub Workflows

This directory contains GitHub Actions workflows for building and releasing the Ping & Modbus Monitor application.

## Workflows

### build.yml
Continuous integration workflow that builds the application for macOS and Windows.

**Triggers:**
- Push to `main` branch
- Pull requests to `main`
- Tags starting with `v*`
- Manual workflow dispatch

**Artifacts:**
- macOS: DMG and ZIP files
- Windows: NSIS installer and portable executable

**Retention:** 7 days

### release.yml
Release workflow that builds and publishes artifacts to GitHub Releases.

**Triggers:**
- Tags starting with `v*`
- Manual workflow dispatch

**Behavior:**
- For tags: Creates/updates a GitHub Release with built artifacts
- For manual runs: Uploads artifacts without creating a release

## Creating a Release

1. Update the version in `package.json`:
   ```json
   "version": "1.0.5"
   ```

2. Commit the version change:
   ```bash
   git add package.json
   git commit -m "Bump version to 1.0.5"
   git push
   ```

3. Create and push a tag:
   ```bash
   git tag v1.0.5
   git push origin v1.0.5
   ```

4. The workflow will automatically:
   - Build for macOS and Windows
   - Create a GitHub Release
   - Attach the build artifacts to the release

## Build Outputs

### macOS
- `Ping & Modbus Monitor-{version}-arm64.dmg` - DMG installer
- `Ping & Modbus Monitor-{version}-arm64-mac.zip` - ZIP archive

### Windows
- `Ping & Modbus Monitor Setup {version}.exe` - NSIS installer
- `Ping & Modbus Monitor {version}.exe` - Portable executable

## Requirements

- Node.js 18
- The workflows use `npm ci` for consistent dependency installation
- Builds use the scripts defined in `package.json`:
  - `dist:mac` for macOS builds
  - `dist:win` for Windows builds

## Troubleshooting

**Build fails on macOS:**
- Check that all dependencies are compatible with macOS
- Ensure icon file exists at `assets/icon.png`

**Build fails on Windows:**
- Verify Windows-specific build configuration in `package.json`
- Check NSIS configuration if installer build fails

**Artifacts not uploaded:**
- Ensure the `release/` directory is being created
- Check that file patterns in upload steps match actual output files

