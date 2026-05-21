import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@omega/shared/logger';
import { verifyToken, type AccessTokenPayload } from './token';

let io: SocketIOServer | null = null;

interface Collaborator {
  userId: string;
  email: string;
  socketId: string;
}

const roomCollaborators = new Map<string, Map<string, Collaborator>>();

export function setupWebSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // ── Authentication middleware ──────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyToken<AccessTokenPayload>(token);
      (socket as unknown as Record<string, unknown>).data = {
        userId: payload.userId,
        email: payload.email,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, email } = socket.data as { userId: string; email: string };

    logger.info('WebSocket', `User connected: ${email} (${socket.id})`);

    // ── Join a project room ──────────────────────────────────────────────
    socket.on('join:project', (projectId: string) => {
      if (!projectId) return;

      socket.join(`project:${projectId}`);

      // Track collaborators
      if (!roomCollaborators.has(projectId)) {
        roomCollaborators.set(projectId, new Map());
      }
      const collaborators = roomCollaborators.get(projectId)!;
      collaborators.set(socket.id, { userId, email, socketId: socket.id });

      // Notify room of new collaborator
      socket.to(`project:${projectId}`).emit('user:joined', {
        userId,
        email,
        socketId: socket.id,
      });

      // Send current collaborators to the joining user
      const currentCollaborators = Array.from(collaborators.values());
      socket.emit('room:collaborators', currentCollaborators);

      logger.info('WebSocket', `${email} joined project:${projectId}`);
    });

    // ── Leave a project room ─────────────────────────────────────────────
    socket.on('leave:project', (projectId: string) => {
      if (!projectId) return;

      socket.leave(`project:${projectId}`);

      const collaborators = roomCollaborators.get(projectId);
      if (collaborators) {
        collaborators.delete(socket.id);
        if (collaborators.size === 0) {
          roomCollaborators.delete(projectId);
        }
      }

      socket.to(`project:${projectId}`).emit('user:left', {
        userId,
        socketId: socket.id,
      });
    });

    // ── Cursor position updates ──────────────────────────────────────────
    socket.on('cursor:move', (data: { projectId: string; position: { x: number; y: number } }) => {
      socket.to(`project:${data.projectId}`).emit('cursor:moved', {
        userId,
        email,
        socketId: socket.id,
        position: data.position,
      });
    });

    // ── Document changes (broadcast to other collaborators) ──────────────
    socket.on('document:change', (data: { projectId: string; blocks: unknown[] }) => {
      socket.to(`project:${data.projectId}`).emit('document:updated', {
        userId,
        blocks: data.blocks,
      });
    });

    // ── Selection changes ────────────────────────────────────────────────
    socket.on('selection:change', (data: { projectId: string; blockId: string | null }) => {
      socket.to(`project:${data.projectId}`).emit('selection:updated', {
        userId,
        blockId: data.blockId,
      });
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      // Remove from all rooms
      for (const [projectId, collaborators] of roomCollaborators.entries()) {
        if (collaborators.has(socket.id)) {
          collaborators.delete(socket.id);
          socket.to(`project:${projectId}`).emit('user:left', {
            userId,
            socketId: socket.id,
          });
          if (collaborators.size === 0) {
            roomCollaborators.delete(projectId);
          }
        }
      }

      logger.info('WebSocket', `User disconnected: ${email} (${socket.id})`);
    });
  });

  logger.info('WebSocket', 'WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
