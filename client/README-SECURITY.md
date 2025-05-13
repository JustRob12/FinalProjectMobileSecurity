# Security Testing for Finance App

This document explains how to run and understand the security tests for the Finance App mobile client.

## Running Security Tests

To run all security tests:

```bash
npm run test:security
```

To run security tests and audit package dependencies:

```bash
npm run security:scan
```

## Test Structure

The security tests are located in the `__tests__/security` directory and are organized into the following areas:

1. **API Security** (`api.test.js`): Tests for proper API authentication, token management, and data sanitization.
2. **Certificate Pinning** (`certificatePinning.test.js`): Tests TLS certificate pinning implementation.
3. **Secure Storage** (`secureStorage.test.js`): Tests for secure storage of sensitive information.
4. **Tokenization** (`tokenization.test.js`): Tests for secure tokenization of payment card data.

## Security Features Implemented

### 1. Tokenization

Payment card information is never stored directly. Instead, it's immediately tokenized, with only the tokens being stored in the app database.

### 2. Certificate Pinning

All financial API communications use TLS 1.3 with certificate pinning to prevent man-in-the-middle attacks.

### 3. Secure Storage

Sensitive data is encrypted before being stored in the device's secure storage.

## Additional Security Controls

- **API Authentication**: All API calls include proper authentication headers.
- **Input Validation**: All user inputs are validated before processing.
- **Error Handling**: Secure error handling to prevent leaking sensitive information.
- **Photo URL Sanitization**: Security controls for user avatars from external providers.

## Manual Security Checks

Some security features cannot be fully automated and require manual verification:

1. Verify certificate pinning configuration in:
   - Android: `android/app/src/main/res/xml/network_security_config.xml`
   - iOS: Certificate validation in AppDelegate.m

2. Verify secure storage implementation:
   - Android: Using Android Keystore
   - iOS: Using Keychain Services

## Troubleshooting

If you encounter issues with the security tests:

1. Ensure all dependencies are properly installed:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Check if the Babel configuration is properly set up:
   ```bash
   npx babel --version
   ```

3. Make sure the Jest configuration is correctly loading TypeScript files:
   ```bash
   cat jest.config.js
   ```

## Contributing

When adding new features, make sure to add appropriate security tests in the `__tests__/security` directory. 