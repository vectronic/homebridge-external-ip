# Homebridge Plugin Conversion Guide

## Project Overview
Homebridge plugin: contact sensor that checks external IP against expected IP.

## Converting a Homebridge v1 Plugin to TypeScript + v2.0

### Template Reference
Use the official template: https://github.com/homebridge/homebridge-plugin-template (branch: `latest`)

### Key Steps

1. **Project structure**: Move source to `src/` directory with TypeScript files:
   - `src/index.ts` - registers platform with `api.registerPlatform(PLATFORM_NAME, PlatformClass)`
   - `src/settings.ts` - exports `PLATFORM_NAME` and `PLUGIN_NAME` constants
   - `src/platform.ts` - implements `DynamicPlatformPlugin` interface
   - `src/platformAccessory.ts` - accessory handler class

2. **package.json changes**:
   - Add `"type": "module"` for ESM
   - Set `"main": "dist/index.js"`
   - Update engines: `"homebridge": "^1.8.0 || ^2.0.0-beta.0"`, `"node": "^20.18.0 || ^22.10.0 || ^24.0.0"`
   - Add build scripts: `"build": "rimraf ./dist && tsc"`, `"prepublishOnly": "npm run lint && npm run build"`
   - DevDependencies: `@eslint/js`, `@types/node`, `eslint`, `homebridge`, `nodemon`, `rimraf`, `typescript`, `typescript-eslint`
   - Remove old runtime dependencies if replaceable (e.g. `requestretry` -> native `fetch`)

3. **TypeScript config** (`tsconfig.json`):
   - Target ES2022, module nodenext, moduleResolution nodenext
   - rootDir: src, outDir: dist
   - strict: true, declaration: true, sourceMap: true

4. **ESM module pattern**:
   - Use `export default (api: API) => {}` instead of `module.exports = function(homebridge) {}`
   - Use `.js` extensions in TypeScript imports: `import { Foo } from './foo.js'`

5. **DynamicPlatformPlugin pattern** (recommended over static):
   - Constructor receives `(log, config, api)` - store `api.hap.Service` and `api.hap.Characteristic`
   - Implement `configureAccessory()` to cache restored accessories
   - Use `api.on('didFinishLaunching', ...)` to discover/register devices
   - Generate UUIDs with `api.hap.uuid.generate(uniqueId)`
   - Register new accessories with `api.registerPlatformAccessories()`
   - Clean up stale cached accessories with `api.unregisterPlatformAccessories()`

6. **Homebridge v2.0 breaking changes** (HAP-NodeJS v1):
   - `BatteryService` -> `Battery`
   - Enums like `Characteristic.Units/Formats/Perms` -> `api.hap.Units/Formats/Perms`
   - `Characteristic.getValue()` removed -> use `Characteristic.value`
   - `Accessory.getServiceByUUIDAndSubType()` -> `Accessory.getServiceById()`
   - `Accessory.updateReachability()` removed
   - `Accessory.setPrimaryService()` -> `Service.setPrimaryService()`

7. **Required files**:
   - `config.schema.json` - for Homebridge UI config. Set `pluginAlias` to match platform name, `pluginType: "platform"`, `singular: true`
   - `.npmignore` - exclude `src/`, `.github/`, config files, `node_modules/`
   - `eslint.config.js` - flat config with `typescript-eslint`
   - `nodemon.json` - for dev workflow

8. **npm Trusted Publisher workflow** (`.github/workflows/publish.yml`):
   - Trigger: `workflow_dispatch` (manual)
   - Permissions: `id-token: write`, `contents: read`
   - Use `actions/setup-node@v4` with `node-version: 24` and `registry-url: 'https://registry.npmjs.org'`
   - Run `npm publish --provenance --access public` (no NPM_TOKEN needed)
   - Workflow filename must exactly match what's configured on npmjs.com
   - Repository URL in package.json must use `git+https://` format

9. **Repository URL format**: npm trusted publishers requires `git+https://github.com/...` format, not `git@github.com:...`
