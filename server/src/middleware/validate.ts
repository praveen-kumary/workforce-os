import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Validates request body against a Zod schema.
 * Replaces req.body with the parsed (and sanitized) data.
 */
export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed; // Replace with validated & sanitized data
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid Request' });
    }
  };
};

/**
 * Validates request query parameters against a Zod schema.
 */
export const validateQuery = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as any;
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query Parameter Validation Error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid Query Parameters' });
    }
  };
};

/**
 * Validates request path parameters against a Zod schema.
 */
export const validateParams = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Path Parameter Validation Error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid Path Parameters' });
    }
  };
};
