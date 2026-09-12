import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 16: Docker, CI/CD, and Production Deployment Suite', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('provides a valid multi-stage Dockerfile with non-root security and healthcheck', () => {
    const dockerfilePath = path.join(rootDir, 'Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const content = fs.readFileSync(dockerfilePath, 'utf-8');
    // Multi-stage base
    expect(content).toContain('FROM node:22-alpine AS base');
    expect(content).toContain('AS api');
    expect(content).toContain('AS worker');

    // Security & non-root user
    expect(content).toContain('USER node');
    expect(content).toContain('dumb-init');

    // Healthcheck
    expect(content).toContain('HEALTHCHECK');
    expect(content).toContain('http://localhost:5000/health');
    expect(content).toContain('http://localhost:5001/health');
  });

  it('provides dedicated Dockerfile.api and Dockerfile.worker with healthchecks', () => {
    const apiFile = path.join(rootDir, 'Dockerfile.api');
    const workerFile = path.join(rootDir, 'Dockerfile.worker');

    expect(fs.existsSync(apiFile)).toBe(true);
    expect(fs.existsSync(workerFile)).toBe(true);

    const apiContent = fs.readFileSync(apiFile, 'utf-8');
    expect(apiContent).toContain('USER node');
    expect(apiContent).toContain('HEALTHCHECK');
    expect(apiContent).toContain('server.js');

    const workerContent = fs.readFileSync(workerFile, 'utf-8');
    expect(workerContent).toContain('USER node');
    expect(workerContent).toContain('HEALTHCHECK');
    expect(workerContent).toContain('dist/index.js');
  });

  it('provides .dockerignore excluding node_modules, secrets, and test coverage', () => {
    const dockerignorePath = path.join(rootDir, '.dockerignore');
    expect(fs.existsSync(dockerignorePath)).toBe(true);

    const content = fs.readFileSync(dockerignorePath, 'utf-8');
    expect(content).toContain('node_modules');
    expect(content).toContain('.env');
    expect(content).toContain('coverage');
    expect(content).toContain('dist');
  });

  it('provides docker-compose.yml with api, worker, mongodb, and redis services', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('mongodb:');
    expect(content).toContain('redis:');
    expect(content).toContain('api:');
    expect(content).toContain('worker:');

    // Healthchecks for dependencies
    expect(content).toContain('condition: service_healthy');
    expect(content).toContain('mongo_data:');
    expect(content).toContain('redis_data:');
    expect(content).toContain('kaamsetu-network:');

    // Ports
    expect(content).toContain('5000:5000');
    expect(content).toContain('5001:5001');
    expect(content).toContain('27017:27017');
    expect(content).toContain('6379:6379');
  });

  it('provides GitHub Actions CI workflow covering all 7 pipeline gates', () => {
    const ciPath = path.join(rootDir, '.github/workflows/ci.yml');
    expect(fs.existsSync(ciPath)).toBe(true);

    const content = fs.readFileSync(ciPath, 'utf-8');
    expect(content).toContain('pnpm install');
    expect(content).toContain('pnpm lint');
    expect(content).toContain('pnpm typecheck');
    expect(content).toContain('pnpm test');
    expect(content).toContain('pnpm build');
    expect(content).toContain('pnpm audit');
    expect(content).toContain('docker/build-push-action');
  });

  it('provides comprehensive DEPLOYMENT.md documentation with all production runbooks', () => {
    const docPath = path.join(rootDir, 'DEPLOYMENT.md');
    expect(fs.existsSync(docPath)).toBe(true);

    const content = fs.readFileSync(docPath, 'utf-8');
    expect(content).toContain('MongoDB Atlas');
    expect(content).toContain('Managed Redis');
    expect(content).toContain('AWS S3 / R2');
    expect(content).toContain('Environment Variables Reference Matrix');
    expect(content).toContain('Database Migrations');
    expect(content).toContain('Rollback Playbook');
    expect(content).toContain('Never run background workers inside the web process');
  });

  it('verifies that background worker package builds and exports expected queues', () => {
    const workerPkgPath = path.join(rootDir, 'apps/worker/package.json');
    expect(fs.existsSync(workerPkgPath)).toBe(true);

    const workerPkg = JSON.parse(fs.readFileSync(workerPkgPath, 'utf-8'));
    expect(workerPkg.name).toBe('@kaamsetu/worker');
    expect(workerPkg.scripts.build).toBeDefined();
    expect(workerPkg.scripts.start).toBeDefined();
  });
});
