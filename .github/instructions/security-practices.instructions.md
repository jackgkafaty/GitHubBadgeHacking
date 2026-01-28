# OWASP Security Best Practices

This document provides security guidelines based on the OWASP Cheat Sheet Series.
Reference: https://cheatsheetseries.owasp.org/

## Authentication

### Password Requirements

- **Minimum length**: 8 characters with MFA enabled, 15 characters without MFA
- **Maximum length**: At least 64 characters to allow passphrases
- **No composition rules**: Don't require specific character types (uppercase, numbers, symbols)
- **Allow all characters**: Including unicode and whitespace
- **No periodic rotation**: Only require password changes on compromise detection
- **Block common passwords**: Check against breached password databases (e.g., HaveIBeenPwned)

### Password Storage

- **Use Argon2id** (preferred): m=19456 (19 MiB), t=2, p=1
- **Alternative - scrypt**: N=2^17, r=8, p=1
- **Alternative - bcrypt**: Work factor 10+ with 72-byte password limit
- **FIPS-140 compliant - PBKDF2**: 600,000+ iterations with HMAC-SHA-256
- **Always salt passwords**: Use unique, random salts per password
- **Consider peppering**: Store pepper separately from database
- **Never use MD5, SHA-1, or plain SHA-256** for password storage

### Authentication Responses

- Return generic error messages: "Invalid username or password"
- Never disclose whether username exists
- Use consistent response times to prevent timing attacks
- Implement account lockout after failed attempts (exponential backoff)

### Multi-Factor Authentication

- Implement MFA wherever possible - prevents 99.9% of account compromises
- Support TOTP, WebAuthn/Passkeys, or hardware tokens
- Require MFA for sensitive operations (password change, email change)

## Session Management

### Session ID Properties

- **Minimum 64 bits of entropy** using CSPRNG
- **At least 16 hexadecimal characters** (or equivalent in other encodings)
- Session ID must be meaningless - no PII or sensitive data encoded
- Use framework's built-in session management

### Cookie Security

```typescript
// Required cookie attributes for session cookies
{
  httpOnly: true,        // Prevent XSS access to cookies
  secure: true,          // HTTPS only
  sameSite: 'strict',    // Prevent CSRF
  path: '/',             // Restrict to application path
  // Don't set domain attribute (restricts to origin server)
  // Don't set expires/max-age for session cookies (non-persistent)
}
```

### Session Lifecycle

- **Regenerate session ID** after authentication (prevent session fixation)
- **Regenerate after privilege changes** (role changes, password changes)
- **Idle timeout**: 2-5 minutes for high-value apps, 15-30 minutes for low-risk
- **Absolute timeout**: 4-8 hours for typical business applications
- **Invalidate sessions server-side** on logout
- Don't store session IDs in URLs

### Transport Layer Security

- Use HTTPS for entire session, not just authentication
- Implement HSTS (HTTP Strict Transport Security)
- Never switch between HTTP and HTTPS mid-session

## Input Validation

### General Principles

- Validate all input on the server side (client-side is UX only)
- Use allowlists, not blocklists
- Validate data type, length, format, and range
- Sanitize for the output context (HTML, SQL, etc.)

### SQL Injection Prevention

```typescript
// ALWAYS use parameterized queries
// ✓ Correct - Prisma ORM (automatically parameterized)
await prisma.user.findUnique({ where: { email: userInput } });

// ✓ Correct - Raw queries with parameters
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;

// ✗ NEVER concatenate user input into queries
await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);
```

### XSS Prevention

- Escape output based on context (HTML, JavaScript, URL, CSS)
- Use Content Security Policy (CSP) headers
- Set `HttpOnly` flag on sensitive cookies
- Use frameworks that auto-escape (React, Next.js)

```typescript
// React/Next.js auto-escapes by default
<div>{userInput}</div>  // ✓ Safe

// Avoid dangerouslySetInnerHTML unless absolutely necessary
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // ✗ Dangerous
```

## API Security

### Rate Limiting

- Implement rate limiting on all endpoints
- Lower limits on authentication endpoints
- Use exponential backoff for repeated failures

### CORS Configuration

```typescript
// Be specific with allowed origins
const corsOptions = {
  origin: ["https://yourdomain.com"], // ✓ Specific origins
  // origin: '*',                      // ✗ Never in production
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
```

### Error Handling

- Never expose stack traces or internal errors to users
- Log detailed errors server-side
- Return generic error messages to clients
- Use different error codes internally vs externally

## Cryptographic Practices

### Key Management

- Never hardcode secrets in source code
- Use environment variables or secrets management (HashiCorp Vault, AWS Secrets Manager)
- Rotate secrets periodically
- Use different secrets per environment

### Token Security

```typescript
// JWT best practices
{
  algorithm: 'RS256',     // Use asymmetric for public verification
  expiresIn: '15m',       // Short-lived access tokens
  // Refresh tokens: longer-lived, stored securely, single-use
}
```

### HTTPS/TLS

- TLS 1.2 minimum, prefer TLS 1.3
- Disable weak cipher suites
- Use strong certificate key sizes (RSA 2048+ or ECDSA P-256+)

## Security Headers

### Recommended Headers

```typescript
// Next.js next.config.js security headers
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];
```

## File Upload Security

### Validation Requirements

- Validate file type by content (magic bytes), not just extension
- Limit file size
- Scan for malware if possible
- Store outside web root or use signed URLs
- Generate random filenames
- Never execute uploaded files

## Logging & Monitoring

### What to Log

- Authentication events (login, logout, failed attempts)
- Authorization failures
- Input validation failures
- Application errors
- Security-relevant events

### What NOT to Log

- Passwords (even hashed)
- Session tokens
- Credit card numbers
- Personal identifiable information (PII)
- API keys or secrets

## OWASP Top 10 Quick Reference

1. **Broken Access Control** - Verify permissions server-side for every request
2. **Cryptographic Failures** - Use strong encryption, proper key management
3. **Injection** - Parameterized queries, input validation, output encoding
4. **Insecure Design** - Threat modeling, secure design patterns
5. **Security Misconfiguration** - Harden configs, remove defaults, update regularly
6. **Vulnerable Components** - Keep dependencies updated, monitor for CVEs
7. **Authentication Failures** - Strong passwords, MFA, secure session management
8. **Software/Data Integrity** - Verify integrity of code and data, use signatures
9. **Security Logging Failures** - Log security events, monitor for anomalies
10. **Server-Side Request Forgery** - Validate URLs, use allowlists, sanitize redirects

## Resources

- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- OWASP Top 10: https://owasp.org/Top10/
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- NIST Password Guidelines: https://pages.nist.gov/800-63-3/sp800-63b.html
