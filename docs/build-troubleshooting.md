# ElizaOS Build Troubleshooting Guide

## Common Issues and Solutions

### 1. TS5055: Cannot write file because it would overwrite input file

**Symptoms**:
```
error TS5055: Cannot write file '.../dist/index.d.ts' because it would overwrite input file.
```

**Solution**:
- Check tsconfig.build.json exclude patterns
- Ensure "dist" is in the exclude list
- Ensure "**/*.d.ts" is excluded
- Run `pnpm clean` and try again

### 2. Missing Types from External Libraries

**Symptoms**:
- IDE shows errors like "Cannot find type definition file for 'better-sqlite3'"
- Build succeeds but TypeScript Language Server shows errors

**Solution**:
- Add missing @types package: `pnpm add -D -w @types/package-name`
- Restart TypeScript server in IDE
- Run `pnpm clean:all && pnpm install`

### 3. ERR_PNPM_LOCKFILE_CONFIG_MISMATCH

**Symptoms**:
```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation.
```

**Solution**:
```bash
rm -f pnpm-lock.yaml
pnpm install --no-frozen-lockfile
```

### 4. Build Succeeds But Runtime Fails

**Symptoms**:
- Builds complete without errors
- Runtime errors about missing imports or undefined methods

**Solution**:
- Check if the package.json "exports" field matches actual exports
- Verify both ESM and CJS formats are generated
- Check entry points defined in tsup.config.ts

### 5. Module Resolution Issues

**Symptoms**:
- "Cannot find module" errors despite successful builds
- Runtime errors about missing exports

**Solution**:
- Check package.json "exports" field is properly configured
- Ensure TypeScript paths in tsconfig.json match physical structure
- Verify that imports use the correct path format (e.g., 'package/public-api')

### 6. Build Hangs or Takes Too Long

**Symptoms**:
- Build process hangs indefinitely
- Takes much longer than expected

**Solution**:
- Try running with `--no-bail` to continue despite errors
- Check for circular dependencies with `pnpm run check:cycles`
- Clean node_modules and reinstall: `pnpm clean:all && pnpm install` 