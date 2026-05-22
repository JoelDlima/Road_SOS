#!/usr/bin/env node
const { program } = require('commander');
const { version } = require('../package.json');

program
  .name('roadsos')
  .description('RoadSoS admin CLI')
  .version(version);

program
  .command('check-env')
  .description('Verify environment variables are set')
  .action(() => {
    const vars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY',
      'EXPO_PUBLIC_GOOGLE_SEARCH_API_KEY',
      'EXPO_PUBLIC_GOOGLE_SEARCH_CX',
    ];
    let allSet = true;
    vars.forEach((v) => {
      if (process.env[v]) {
        console.log(`✅ ${v} is set`);
      } else {
        console.log(`❌ ${v} is NOT set`);
        allSet = false;
      }
    });
    process.exit(allSet ? 0 : 1);
  });

program
  .command('validate-seeds')
  .description('Validate seed data structure')
  .action(() => {
    try {
      const { SEED_SERVICES, MUMBAI_SEED, DELHI_SEED, REGIONS } = require('../lib/offline-cache');
      console.log(`✅ Goa: ${SEED_SERVICES.length} services`);
      console.log(`✅ Mumbai: ${MUMBAI_SEED.length} services`);
      console.log(`✅ Delhi: ${DELHI_SEED.length} services`);
      console.log(`✅ Regions: ${Object.keys(REGIONS).join(', ')}`);
    } catch (err) {
      console.error('❌ Validation failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('check-types')
  .description('Run TypeScript type checking')
  .action(() => {
    const { execSync } = require('child_process');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      console.log('✅ TypeScript check passed');
    } catch {
      process.exit(1);
    }
  });

program.parse();
