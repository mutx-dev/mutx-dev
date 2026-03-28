import { schemas } from '../../app/api/_lib/validation'

describe('validation schemas', () => {
  describe('login schema', () => {
    it('accepts valid login credentials', async () => {
      const result = await schemas.login.safeParseAsync({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
        expect(result.data.password).toBe('password123')
      }
    })

    it('rejects invalid email format', async () => {
      const result = await schemas.login.safeParseAsync({
        email: 'not-an-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', async () => {
      const result = await schemas.login.safeParseAsync({
        email: 'test@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('register schema', () => {
    it('accepts valid registration data', async () => {
      const result = await schemas.register.safeParseAsync({
        email: 'newuser@example.com',
        password: 'securepassword',
        name: 'New User',
      })
      expect(result.success).toBe(true)
    })

    it('rejects short password', async () => {
      const result = await schemas.register.safeParseAsync({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      })
      expect(result.success).toBe(false)
    })

    it('rejects missing name', async () => {
      const result = await schemas.register.safeParseAsync({
        email: 'test@example.com',
        password: 'password123',
        name: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('lead schema', () => {
    it('accepts minimal lead submission with email only', async () => {
      const result = await schemas.lead.safeParseAsync({
        email: 'lead@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('accepts full lead submission', async () => {
      const result = await schemas.lead.safeParseAsync({
        email: 'lead@example.com',
        name: 'Test Lead',
        company: 'Test Corp',
        message: 'Interested in your product',
        source: 'contact-page',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing email', async () => {
      const result = await schemas.lead.safeParseAsync({
        name: 'Missing Email',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email format', async () => {
      const result = await schemas.lead.safeParseAsync({
        email: 'not-email',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('apiKeyCreate schema', () => {
    it('accepts valid API key creation request', async () => {
      const result = await schemas.apiKeyCreate.safeParseAsync({
        name: 'my-api-key',
      })
      expect(result.success).toBe(true)
    })

    it('accepts API key with expiry', async () => {
      const result = await schemas.apiKeyCreate.safeParseAsync({
        name: 'my-api-key',
        expires_in_days: 30,
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty key name', async () => {
      const result = await schemas.apiKeyCreate.safeParseAsync({
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative expiry', async () => {
      const result = await schemas.apiKeyCreate.safeParseAsync({
        name: 'my-api-key',
        expires_in_days: -1,
      })
      expect(result.success).toBe(false)
    })

    it('rejects expiry over 365 days', async () => {
      const result = await schemas.apiKeyCreate.safeParseAsync({
        name: 'my-api-key',
        expires_in_days: 400,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('agentCreate schema', () => {
    it('accepts minimal agent creation', async () => {
      const result = await schemas.agentCreate.safeParseAsync({
        name: 'my-agent',
      })
      expect(result.success).toBe(true)
    })

    it('accepts full agent creation with all fields', async () => {
      const result = await schemas.agentCreate.safeParseAsync({
        name: 'my-agent',
        description: 'A helpful agent',
        model: 'gpt-4',
        system_prompt: 'You are a helpful assistant.',
      })
      expect(result.success).toBe(true)
    })

    it('rejects missing agent name', async () => {
      const result = await schemas.agentCreate.safeParseAsync({
        name: '',
      })
      expect(result.success).toBe(false)
    })
  })
})
