# Security Demands & Requirements

This document outlines security requirements for full-stack web applications. It serves as a reusable template for modern enterprise applications.

---

## 1. Authentication & Authorization

### 1.1 Identity Management
*   **Identity Provider**: Support integration with industry-standard identity providers (OAuth 2.0 / OpenID Connect). Prefer Azure AD, AWS Cognito, or similar enterprise IAM solutions.
*   **Development Mode**: Provide a lightweight development authentication provider (e.g., `DevAuth`) for local testing without external dependencies.
*   **Session Management**: Implement proper session tracking with configurable timeouts.
*   **MFA**: If possible and appropriate, add MFA functionality.
*   **Misuse**: Implement missuse tracking and implement lockout and notification functionality.

### 1.2 Token-Based Security
*   **JWT Support**: Use JSON Web Tokens (JWT) for stateless authentication.
*   **Secure Storage**: 
    *   Tokens MUST NOT be stored in `localStorage`.
    *   Prefer HTTP-only secure cookies (requires CSRF protection) or in-memory storage (can't handle page refreshes).
*   **Token Refresh**: Implement token refresh mechanisms to maintain sessions without re-authentication.
*   **Short Expiry**: Access tokens should have short expiration times (15-60 minutes recommended).
*   **Log out**: make sure tokens are removed from storage when user logs out and session is terminated.

### 1.3 Access Control
*   **Route Protection**: Unauthenticated users must be redirected to login. All application routes must be protected.
*   **API Authorization**: All API endpoints must validate the Bearer token before processing requests.
*   **Role-Based Access Control (RBAC)**: Implement role/permission systems for fine-grained access control where applicable.

---

## 2. API Security

### 2.1 Transport Security
*   **HTTPS Only**: All communication between frontend and backend must occur over TLS 1.2+.
*   **HSTS Headers**: Implement HTTP Strict Transport Security headers in production.
*   **Certificate Validation**: Enforce proper certificate validation on all external API calls.

### 2.2 Request Validation
*   **Input Sanitization**: All user inputs must be validated and sanitized on both client and server sides.
*   **Size Limits**: Enforce maximum payload sizes to prevent denial-of-service attacks.
*   **Content-Type Validation**: Reject requests with unexpected content types.
*   **Anti-CSRF Tokens**: Implement CSRF protection for state-changing operations.

### 2.3 API Design
*   **Rate Limiting**: Implement request rate limiting to prevent abuse.
*   **Id Parameters**: Never use internal Ids or incremental integers as parameters. Use Guids or unique strings instead.
*   **CORS Configuration**: Define strict Cross-Origin Resource Sharing policies.
*   **API Versioning**: Version APIs to allow secure deprecation of insecure endpoints.
*   **Integrations**: For system to system integrations, use API keys or certificates instead of personal tokens.

---

## 3. Data Security

### 3.1 Data at Rest
*   **Encryption**: Sensitive data stored in databases must be encrypted at rest (AES-256 recommended).
*   **Secure Keys**: Encryption keys must be managed via a dedicated secrets manager (Azure Key Vault, AWS Secrets Manager).
*   **PII Protection**: Personally Identifiable Information (PII) requires additional handling and audit logging. Ask business for specific requirements.

### 3.2 Data in Transit
*   **TLS Encryption**: All data transmitted between services must be encrypted using TLS 1.2+.
*   **No Sensitive Data in URLs**: Sensitive data must never be passed as query parameters.
*   **Secure Headers**: Implement security headers (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy).

### 3.3 File Handling
*   **Upload Validation**: Validate file type, size, and content before processing.
*   **Isolated Storage**: Uploaded files should be stored in isolated, non-executable locations.
*   **Malware Scanning**: Consider integrating malware scanning for user-uploaded content.
*   **Access Control**: File access must respect user permissions and project boundaries.

### 3.4 Non production environments
*   **Laundried data**: For QA environment, implement data laundering when taking production data to prevent data leaks.
*   **Generated data**: For Dev/Test environment, implement data generation to make sure no sensitive data is in use.


---

## 4. Frontend Security

### 4.1 Content Security
*   **XSS Prevention**: Escape/sanitize all user-generated content before rendering.
*   **CSP Headers**: Implement strict Content Security Policy headers.
*   **No Eval**: Avoid `eval()` and similar dynamic code execution patterns.

### 4.2 Safe Execution
*   **No Arbitrary Code Execution**: The frontend must never execute arbitrary code from backend responses.
*   **Dependency Auditing**: Regularly audit frontend dependencies for known vulnerabilities.

### 4.3 Client-Side Storage
*   **No Secrets in Client Storage**: Never store API keys, tokens, or secrets in localStorage/sessionStorage.
*   **Secure Cookie Flags**: Cookies must use `HttpOnly`, `Secure`, and `SameSite` attributes.

---

## 5. Infrastructure Security

### 5.1 Environment Separation
*   **Distinct Environments**: Maintain separate Development, Staging, and Production environments.
*   **Configuration Isolation**: Environment-specific configurations must not leak between environments.
*   **Production Hardening**: Development/debugging features must be disabled in production.

### 5.2 Secrets Management
*   **No Hardcoded Secrets**: Never hardcode credentials, API keys, or connection strings in source code.
*   **Environment Variables**: Use environment variables or secrets management services in production.
*   **Rotation Policy**: Implement regular rotation of credentials and API keys.

### 5.3 Logging & Monitoring
*   **Audit Logging**: Log security-relevant events (login attempts, access denials, data modifications).
*   **No Sensitive Data in Logs**: Never log passwords, tokens, or sensitive PII. 
*   **Masking**: For sensitiv information that is needed for troubleshooting, make sure to mask it. This includes sensitive fields in full payloads. 
*   **Alerting**: Configure alerts for suspicious activity patterns.
*   **Log Retention**: Define appropriate log retention policies for compliance.

---

## 6. Injection Prevention

### 6.1 SQL Injection
*   **Parameterized Queries**: Always use parameterized queries or ORM methods (Entity Framework).
*   **No Dynamic SQL**: Avoid string concatenation for SQL queries.

### 6.2 NoSQL Injection
*   **Query Validation**: Validate and sanitize all inputs used in NoSQL queries.

### 6.3 Command Injection
*   **Avoid Shell Commands**: Minimize usage of system shell commands.
*   **Parameter Sanitization**: If shell commands are necessary, strictly sanitize inputs.

---

## 7. Compliance Considerations

> [!NOTE]
> The following are general considerations. Adapt based on your specific regulatory requirements.

*   **GDPR**: Implement data subject rights (access, deletion, portability) if handling EU citizens' data.
*   **SOC 2**: Follow security controls for service organizations handling customer data.
*   **Data Residency**: Consider geographic data storage requirements.
*   **Consent Management**: Implement consent tracking for data processing where required.

---

## 8. Security Testing

### 8.1 Automated Security Scans
*   **SAST**: Integrate Static Application Security Testing in CI/CD pipelines.
*   **DAST**: Perform Dynamic Application Security Testing regularly.
*   **Dependency Scanning**: Automatically scan for vulnerable dependencies.

### 8.2 Manual Reviews
*   **Code Reviews**: Security-focused code review for authentication, authorization, and data handling changes.
*   **Penetration Testing**: Schedule periodic penetration testing for critical applications.

---

## Summary Checklist

| Category | Requirement | Priority |
|----------|-------------|----------|
| Auth | JWT tokens with secure storage | Critical |
| Auth | Route/API protection | Critical |
| API | HTTPS only | Critical |
| API | Input validation (client + server) | Critical |
| Data | Encryption at rest and in transit | High |
| Data | Secure file handling | High |
| Frontend | XSS prevention | Critical |
| Frontend | CSP headers | High |
| Infra | Secrets management | Critical |
| Infra | Audit logging | High |
| Injection | Parameterized queries | Critical |
