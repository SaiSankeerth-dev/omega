import { describe, it, expect } from 'vitest'
import request from 'supertest'
import '../mocks/prisma'
import app from '../../apps/server/src/index'

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('requires name, email, and password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('requires valid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'invalid', password: 'Password1!' })

      expect(res.status).toBe(400)
    })

    it('requires minimum password length of 8', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: 'Ab1!' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('requires email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})

      expect(res.status).toBe(400)
    })

    it('requires valid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'password' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('requires refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({})

      expect(res.status).toBe(400)
    })

    it('requires non-empty refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' })

      expect(res.status).toBe(400)
    })
  })
})
