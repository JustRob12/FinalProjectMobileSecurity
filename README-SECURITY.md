# Finance App Security Testing Guide

This guide explains how to run security tests for the Finance App to ensure it complies with security best practices and PCI DSS requirements.

## Prerequisites

- Node.js 16+
- Docker and Docker Compose
- Git

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finance-app.git
   cd finance-app
   ```

2. Install dependencies:
   ```bash
   cd client
   npm install --legacy-peer-deps
   cd ../server
   npm install
   ```

## Security Testing Suite

Our security testing is organized into three main categories:

1. **Client-side Security Testing**
2. **Server-side Security Testing**
3. **API Security Testing (DAST)**

## 1. Client-side Security Testing

To run client-side security tests:

```bash
cd client
npm run test:security
```

This will run all tests in the `__tests__/security` directory, which includes:

- Tokenization security tests
- Secure storage tests
- API security tests
- Certificate pinning tests

### Manual Security Checks

- **Certificate Pinning**: Verify that `android/app/src/main/res/xml/network_security_config.xml` contains the correct certificate pins
- **Sensitive Data Handling**: Ensure no sensitive data is logged or stored unencrypted

## 2. Server-side Security Testing

To run server-side security tests:

```bash
cd server
npm run test:security
```

This includes:

- SQL Injection prevention tests
- Authentication security tests
- Authorization tests

## 3. API Security Testing (DAST)

We use OWASP ZAP for Dynamic Application Security Testing:

```bash
# From the server directory
docker-compose -f docker-compose-security.yml up
```

This will:

1. Start a ZAP container
2. Run automated security scans against your API
3. Generate a security report in `server/security/reports`

### Specific Security Tests

#### Payment Gateway Security

To specifically test payment gateway security:

```bash
cd server
npm run test:payment-security
```

#### Data Leak Testing

To test for potential data leaks:

```bash
cd client
npm run test:data-leak
```

## PCI DSS Compliance

For PCI DSS compliance information, see [docs/PCI-DSS-COMPLIANCE.md](docs/PCI-DSS-COMPLIANCE.md)

## Recommended Security Testing Schedule

- **Daily**: Automated security tests in CI/CD pipeline
- **Weekly**: SAST scans with Checkmarx
- **Monthly**: DAST scans with OWASP ZAP
- **Quarterly**: Full penetration testing by security team

## Security Contacts

If you discover a security vulnerability, please DO NOT open a public issue. Instead, email:

- security@your-company.com
- [Security Officer Name]: [email@your-company.com]

## Additional Resources

- [OWASP Mobile Security Testing Guide](https://owasp.org/www-project-mobile-security-testing-guide/)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/document_library/)
- [React Native Security Best Practices](https://reactnative.dev/docs/security) 