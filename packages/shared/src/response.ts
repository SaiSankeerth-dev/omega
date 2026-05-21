// Response helpers — designed for Express but usable anywhere
// The Res type is kept flexible to avoid hard Express dependency in shared package

interface ResLike {
  status(code: number): ResLike;
  json(body: unknown): ResLike;
  send(): void;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const sendSuccess = <T>(
  res: ResLike,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
};

export const sendCreated = <T>(res: ResLike, data: T) =>
  sendSuccess(res, data, 201);

export const sendNoContent = (res: ResLike) =>
  res.status(204).send();

export const sendError = (
  res: ResLike,
  message: string,
  statusCode = 400,
  code?: string,
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(code && { code }),
    },
  });
};

export const sendPaginated = <T>(
  res: ResLike,
  data: T[],
  total: number,
  page: number,
  limit: number,
) => {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    } satisfies PaginationMeta,
  });
};
