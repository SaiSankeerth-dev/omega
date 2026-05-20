import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './users';
import { projectRouter } from './projects';
import { aiRouter } from './ai';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/ai', aiRouter);
