import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateApiEnv, validateWorkerEnv } from '../backend/packages/config/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => void | boolean | string): void {
  try {
    const res = fn();
    if (res === false) {
      results.push({ name, passed: false, message: 'Check returned false' });
    } else {
      results.push({
        name,
        passed: true,
        message: typeof res === 'string' ? res : 'Passed',
      });
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log('\n🔍 =========================================================');
console.log('   KaamSetu Deployment & Render Readiness Verification');
console.log('   =========================================================\n');

// 1. Check Node.js Engine
check('Node.js Runtime Environment', () => {
  const version = process.version;
  const major = parseInt(version.replace('v', '').split('.')[0], 10);
  if (major < 22) {
    throw new Error(`Node.js version is ${version}. Render target is >= 22.0.0.`);
  }
  return `Running Node.js ${version}`;
});

// 2. Check Package Engines
check('Root package.json Engine Constraints', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.engines?.node) {
    throw new Error('Missing engines.node in root package.json');
  }
  return `Declared Node: ${pkg.engines.node}, pnpm: ${pkg.engines.pnpm || 'any'}`;
});

// 3. Check Workspace Build Artifacts
const requiredArtifacts = [
  'backend/packages/types/dist/index.js',
  'backend/packages/logger/dist/index.js',
  'backend/packages/config/dist/index.js',
  'backend/packages/validation/dist/index.js',
  'backend/apps/api/dist/server.js',
  'backend/apps/worker/dist/index.js',
];

for (const relPath of requiredArtifacts) {
  check(`Build Artifact: ${relPath}`, () => {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Compiled artifact missing: ${relPath}. Run pnpm build:backend first.`);
    }
    const stat = fs.statSync(fullPath);
    return `Present (${(stat.size / 1024).toFixed(1)} KB)`;
  });
}

// 4. Validate API Environment Schema
check('API Environment Variable Schema Validation', () => {
  const testApiEnv = {
    NODE_ENV: 'production',
    PORT: '10000',
    MONGODB_URI: 'mongodb+srv://test:pass@cluster0.mongodb.net/kaamsetu',
    REDIS_URL: 'rediss://default:pass@redis-singapore.render.com:6379',
    JWT_ACCESS_SECRET: 'super_secret_test_jwt_access_token_min_32_characters!',
    JWT_REFRESH_SECRET: 'super_secret_test_jwt_refresh_token_min_32_characters!',
    CORS_ORIGINS: 'https://kaamsetu.vercel.app/',
  };

  const parsed = validateApiEnv(testApiEnv);
  if (parsed.PORT !== 10000) throw new Error('Port parsing failed');
  if (parsed.CORS_ORIGINS[0] !== 'https://kaamsetu.vercel.app') {
    throw new Error('CORS trailing slash trimming failed');
  }
  return 'API schema validated and normalized trailing slash correctly';
});

// 5. Validate Worker Environment Isolation (Zero API Secret Dependency)
check('Worker Environment Isolation Validation', () => {
  const testWorkerEnv = {
    NODE_ENV: 'production',
    MONGODB_URI: 'mongodb+srv://test:pass@cluster0.mongodb.net/kaamsetu',
    REDIS_URL: 'rediss://default:pass@redis-singapore.render.com:6379',
    WORKER_HEALTH_PORT: '5001',
  };

  const parsed = validateWorkerEnv(testWorkerEnv);
  if (parsed.WORKER_HEALTH_PORT !== 5001) throw new Error('Worker health port failed');
  return 'Worker boots cleanly without requiring JWT secrets or CORS origins';
});

// 6. Validate Render Blueprint Configuration (render.yaml)
check('Render Blueprint (render.yaml) Integrity', () => {
  const blueprintPath = path.join(rootDir, 'render.yaml');
  if (!fs.existsSync(blueprintPath)) {
    throw new Error('render.yaml is missing from repository root');
  }

  const content = fs.readFileSync(blueprintPath, 'utf8');
  if (!content.includes('name: kaamsetu-api')) {
    throw new Error('kaamsetu-api web service is missing from render.yaml');
  }
  if (!content.includes('type: keyvalue')) {
    throw new Error('Modern Render Key Value (type: keyvalue) is missing from render.yaml');
  }
  if (!content.includes('healthCheckPath: /health')) {
    throw new Error('healthCheckPath is missing or incorrect in render.yaml');
  }
  if (!content.includes('maxmemoryPolicy: noeviction')) {
    throw new Error('BullMQ requires maxmemoryPolicy: noeviction in render.yaml');
  }
  return 'Modern Render Blueprint specification validated';
});

// 7. Check Production CORS Wildcard Rejection
check('Production CORS Security Wildcard Guard', () => {
  let threw = false;
  try {
    validateApiEnv({
      NODE_ENV: 'production',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'min_32_characters_secret_access_token_123456',
      JWT_REFRESH_SECRET: 'min_32_characters_secret_refresh_token_12345',
      CORS_ORIGINS: '*',
    });
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error('Production should reject wildcard CORS origins');
  }
  return 'Production wildcard CORS origins rejected as required';
});

// 8. Check .env.example Documentation Completeness
check('Environment Variable Documentation (.env.example)', () => {
  const envExamplePath = path.join(rootDir, '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    throw new Error('.env.example missing from root');
  }
  const content = fs.readFileSync(envExamplePath, 'utf8');
  const requiredKeys = [
    'MONGODB_URI',
    'REDIS_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGINS',
    'REQUIRE_REDIS',
  ];
  for (const key of requiredKeys) {
    if (!content.includes(key)) {
      throw new Error(`Missing ${key} documentation in .env.example`);
    }
  }
  return 'All required variables documented in .env.example';
});

// Summary output
console.log('Results:');
let allPassed = true;
for (const r of results) {
  const icon = r.passed ? '✅' : '❌';
  console.log(`  ${icon} [${r.name}]: ${r.message}`);
  if (!r.passed) allPassed = false;
}

console.log('\n=========================================================');
if (allPassed) {
  console.log('🎉 ALL DEPLOYMENT READINESS CHECKS PASSED!');
  console.log('=========================================================\n');
  process.exit(0);
} else {
  console.error('🚨 DEPLOYMENT VERIFICATION FAILED! See errors above.');
  console.log('=========================================================\n');
  process.exit(1);
}
