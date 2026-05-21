import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../lib/token';
import { sendSuccess, sendError } from '@omega/shared/response';

export const oauthRouter = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── GitHub OAuth authorize URL ─────────────────────────────────────────
oauthRouter.get(
  '/github/authorize',
  asyncHandler(async (_req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${FRONTEND_URL}/auth/callback&scope=user:email&state=${Date.now()}`;
    sendSuccess(res, { url });
  }),
);

// ── GitHub OAuth callback ──────────────────────────────────────────────
oauthRouter.post(
  '/github/callback',
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) {
      sendError(res, 'Authorization code is required');
      return;
    }

    try {
      // Exchange code for access token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        sendError(res, 'Failed to get GitHub access token');
        return;
      }

      // Fetch user info from GitHub
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });
      const githubUser = await userRes.json() as { id: number; login: string; email?: string; avatar_url?: string; name?: string };

      // Fetch email if not public
      let email = githubUser.email;
      if (!email) {
        const emailRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json',
          },
        });
        const emails = await emailRes.json() as { email: string; primary: boolean; verified: boolean }[];
        const primary = emails.find((e: any) => e.primary);
        email = primary?.email || emails[0]?.email || `${githubUser.login}@github.com`;
      }

      // Find or create user
      let user = await prisma.user.findFirst({
        where: { githubId: String(githubUser.id) } as any,
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: githubUser.name || githubUser.login,
            githubId: String(githubUser.id),
            avatarUrl: githubUser.avatar_url,
            passwordHash: '',
            emailVerified: true,
          } as any,
        });

        // Create a notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'welcome',
            title: 'Welcome to Omega!',
            message: 'Your account was created via GitHub. Explore the platform to get started.',
          } as any,
        });
      } else {
        // Update last login
        await prisma.user.update({
          where: { id: user.id } as any,
          data: { lastLoginAt: new Date(), avatarUrl: githubUser.avatar_url } as any,
        });
      }

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user.id, email: user.email, sessionId: '', role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, sessionId: '' });

      sendSuccess(res, {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('GitHub OAuth error:', err);
      sendError(res, 'OAuth authentication failed');
    }
  }),
);

// ── Check OAuth providers ──────────────────────────────────────────────
oauthRouter.get(
  '/providers',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, {
      providers: [
        {
          id: 'github',
          name: 'GitHub',
          enabled: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET),
          icon: 'github',
        },
      ],
    });
  }),
);
