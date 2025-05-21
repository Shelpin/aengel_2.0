# ElizaOS Build System

This directory contains the scripts and configuration for the ElizaOS build system, designed to create a clean, reproducible build for all packages.

## Quick Start

To run a complete build of all packages:

```bash
# From the project root:
./clean-build.sh
```

This will:
1. Check for circular dependencies
2. Standardize package configurations
3. Build all packages in dependency order
4. Verify the built packages
5. Generate a build report

## Build Tools

### Main Scripts

- `master-build.sh` - Main entry point that runs the entire build process
- `clean-build.sh` - Builds packages in the correct dependency order
- `check-cycles.js` - Checks for circular dependencies in the codebase
- `verify-packages.js` - Verifies that built packages can be imported correctly

### Configuration Standardization

- `standardize-package-scripts.js` - Updates package.json files with standard scripts and exports
- `standardize-tsconfig.js` - Creates or updates tsconfig.build.json files in each package
- `postbuild-dual.js` - Creates CommonJS wrappers for ESM modules to support dual module usage

### Templates

- `package-template.json` - Template for standardized package.json files
- `tsconfig.build.template.json` - Template for standardized tsconfig.build.json files

## Package Build Order

Packages are built in the following order to respect dependencies:

1. `@elizaos/types`
2. `@elizaos/core`
3. `@elizaos/adapter-sqlite`
4. `@elizaos/dynamic-imports`
5. `@elizaos/plugin-bootstrap`
6. `@elizaos/clients/telegram`
7. `@elizaos/telegram-multiagent`
8. `@elizaos/client-direct`
9. `@elizaos/agent`

## Build Artifacts

Build outputs are stored in each package's `dist` directory and include:

- JavaScript files (`.js`)
- TypeScript declaration files (`.d.ts`)
- Source maps (`.js.map`, `.d.ts.map`)
- CommonJS compatibility files (`.cjs`)

## Build Reports

Build reports and logs are stored in the `reports/build_output` directory:

- `build.log` - Complete build log
- `build-report.md` - Summary of the build process
- `cycles-before.log` - Initial circular dependency report
- `cycles-after.log` - Final circular dependency report
- `dep-graph-after.png` - Dependency graph visualization

## CI/CD Integration

The build system is integrated with GitHub Actions for CI/CD:

- Builds are triggered on pushes to main branches and pull requests
- Tests are run after successful builds
- Build logs and test results are stored as artifacts

## Troubleshooting

### Common Issues

1. **Circular Dependencies**
   - Run `node scripts/build/check-cycles.js` to identify cycles
   - Resolve cycles by moving shared types to the types package or using dependency injection

2. **Build Failures**
   - Check `reports/build_output/build.log` for detailed errors
   - Ensure all dependencies are properly declared in package.json

3. **Import Errors**
   - Ensure proper ESM imports with `.js` extensions
   - Check exports field in package.json is correctly configured

## Contributing

When adding new packages:

1. Update the `ORDER` array in `scripts/build/clean-build.sh` with the new package
2. Run the standardization scripts to ensure correct configuration
3. Follow the existing patterns for imports and exports
4. Test the build to ensure no circular dependencies are introduced

## Script Customization

To modify the build process:

1. Edit `master-build.sh` to add or remove build phases
2. Update templates to change standardized configurations
3. Modify `verify-packages.js` to add additional verification steps