#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const originalConfig = path.join(__dirname, 'svelte.config.js');
const mobileConfig = path.join(__dirname, 'svelte.config.mobile.js');
const backupConfig = path.join(__dirname, 'svelte.config.js.backup');

console.log('📱 Building for mobile platforms...\n');

try {
  // Backup original config
  console.log('💾 Backing up svelte.config.js');
  fs.copyFileSync(originalConfig, backupConfig);

  // Copy mobile config
  console.log('🔧 Switching to mobile configuration');
  fs.copyFileSync(mobileConfig, originalConfig);

  // Build
  console.log('🏗️  Building web app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Sync to Capacitor
  console.log('\n📲 Syncing to native platforms...');
  execSync('npx cap sync', { stdio: 'inherit' });

  console.log('\n✅ Mobile build complete!');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore original config
  console.log('🔄 Restoring original configuration');
  if (fs.existsSync(backupConfig)) {
    fs.copyFileSync(backupConfig, originalConfig);
    fs.unlinkSync(backupConfig);
  }
}
