import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const errorCode = err.code || 'INTERNAL_ERROR'
  const message = err.message || '服务器内部错误'

  console.error(`[Error] ${errorCode}: ${message}`)
  if (err.details) {
    console.error('[Error Details]', err.details)
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details: err.details
    }
  })
}

export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError => {
  const error: ApiError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.details = details
  return error
}
