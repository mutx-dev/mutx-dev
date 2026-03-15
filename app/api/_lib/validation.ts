import { z } from 'zod'
import { NextResponse } from 'next/server'

// Generic validation helper
export async function validateRequest<T extends z.ZodSchema>(
  schema: T,
  request: Request
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const result = await schema.safeParseAsync(body)
    
    if (!result.success) {
      const formatted = result.error.format()
      const details: Record<string, { message: string }[]> = {}
      
      // Extract field-specific errors
      for (const [key, value] of Object.entries(formatted)) {
        if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value) {
          const errObj = value as Record<string, unknown>
          const errors = errObj._errors as unknown[]
          details[key] = errors.map((msg) => ({ message: String(msg) }))
        }
      }
      
      const response = NextResponse.json(
        {
          status: 'error' as const,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details,
          },
        },
        { status: 400 }
      )
      return { success: false, response }
    }
    
    return { success: true, data: result.data }
  } catch {
    // Handle JSON parse errors
    const response = NextResponse.json(
      {
        status: 'error' as const,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
        },
      },
      { status: 400 }
    )
    return { success: false, response }
  }
}

// Common validation schemas
export const schemas = {
  // Auth schemas
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
  
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  }),
  
  // Lead schema
  lead: z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().max(100, 'Name too long').optional(),
    company: z.string().max(200, 'Company name too long').optional(),
    message: z.string().max(2000, 'Message too long').optional(),
    source: z.string().max(50, 'Source too long').optional(),
  }),
  
  // API Key schemas
  apiKeyCreate: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    expires_in_days: z.number().int().positive().max(365, 'Max expiry is 365 days').optional(),
  }),
  
  // Agent schemas
  agentCreate: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    model: z.string().optional(),
    system_prompt: z.string().max(10000, 'System prompt too long').optional(),
  }),
  
  agentUpdate: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    description: z.string().max(500, 'Description too long').optional(),
    model: z.string().optional(),
    system_prompt: z.string().max(10000, 'System prompt too long').optional(),
  }),
  
  // Deployment schemas
  deploymentCreate: z.object({
    agent_id: z.string().uuid('Invalid agent ID'), replicas: z.number().int().positive().max(10, 'Max replicas is 10').optional(),
    environment: z.enum(['development', 'staging', 'production']).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
  
  // Webhook schemas
  webhookCreate: z.object({
    url: z.string().url('Invalid URL format').max(2048, 'URL too long'),
    events: z.array(z.string().min(1, 'Event name cannot be empty')).min(1, { message: 'At least one event required' }).max(20, { message: 'Too many events' }),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    secret: z.string().max(256, 'Secret too long').optional(),
  }),
  
  webhookUpdate: z.object({
    url: z.string().url('Invalid URL format').max(2048, 'URL too long').optional(),
    events: z.array(z.string().min(1, 'Event name cannot be empty')).min(1, { message: 'At least one event required' }).max(20, { message: 'Too many events' }).optional(),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    secret: z.string().max(256, 'Secret too long').optional(),
    active: z.boolean().optional(),
  }),
  
  // Newsletter schema
  newsletter: z.object({
    email: z.string().email('Invalid email format'),
  }),
  
  // Generic ID parameter
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
}
