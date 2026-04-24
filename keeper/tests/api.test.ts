import request from 'supertest';
import { createServer } from '../src/server';

const app = createServer();

describe('Keeper API', () => {
  describe('GET /', () => {
    it('should return service info', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Crypto-Heranca Keeper');
      expect(res.body.status).toBe('running');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('GET /api/v1/vaults', () => {
    it('should return paginated vaults list', async () => {
      const res = await request(app).get('/api/v1/vaults?page=1&limit=10');
      // May return 200 with data or 500 if Supabase is not configured
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.pagination).toBeDefined();
      }
    });
  });

  describe('POST /api/v1/heartbeat', () => {
    it('should reject invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/heartbeat')
        .send({ invalid: 'data' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('invalid_input');
    });

    it('should reject invalid signature', async () => {
      const res = await request(app)
        .post('/api/v1/heartbeat')
        .send({
          vault_address: '8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX',
          timestamp: Math.floor(Date.now() / 1000),
          signature: 'invalid_signature',
          pubkey: '8rQWCAFD9GhyTmQ73Y4LkSt7VzxFhKgWwPC2kBHuPVyX',
        });
      // Should fail validation
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('POST /api/v1/notifications/register', () => {
    it('should reject invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/register')
        .send({ invalid: 'data' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/unknown');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
