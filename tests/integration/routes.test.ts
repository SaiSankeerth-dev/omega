import { describe, it, expect } from 'vitest'
import request from 'supertest'
import '../mocks/prisma'
import app from '../../apps/server/src/index'

describe('API Routes', () => {
  describe('GET /health', () => {
    it('returns health status with required fields', async () => {
      const res = await request(app).get('/health')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status')
      expect(res.body).toHaveProperty('db')
      expect(res.body).toHaveProperty('uptime')
      expect(res.body).toHaveProperty('timestamp')
      expect(res.body).toHaveProperty('version')
    })
  })

  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent')

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
      expect(res.body.code).toBe('NOT_FOUND')
    })

    it('returns 404 for unknown API paths', async () => {
      const res = await request(app).get('/unknown-path')

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })
  })

  describe('API route structure', () => {
    it('has auth routes registered', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'test' })

      // Should get either 401 (invalid creds) or 200 (success) — proves route exists
      expect([200, 401]).toContain(res.status)
    })

    it('has user routes registered', async () => {
      const res = await request(app).get('/api/users/123')

      // Route exists (not 404) — auth middleware returns an error because no token
      expect(res.status).not.toBe(404)
    })

    it('has project routes registered', async () => {
      const res = await request(app).get('/api/projects')

      // Route exists (not 404)
      expect(res.status).not.toBe(404)
    })

    it('has template routes registered', async () => {
      const res = await request(app).get('/api/templates')

      // Templates are public, so should not be 401 or 404
      expect(res.status).not.toBe(404)
    })

    it('has editor routes registered', async () => {
      const res = await request(app).get('/api/editor/proj-1')

      // Route exists (not 404)
      expect(res.status).not.toBe(404)
    })
  })
})
