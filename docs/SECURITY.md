# Security Policy

## Supported Versions

This tool is currently in active development. Security updates are provided for the latest version only.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

## Security Considerations

### When Using This Tool

**Critical Security Practices:**

1. **Never Commit Sensitive Data**
   - API keys, passwords, tokens, credentials
   - Database connection strings
   - Private keys or certificates
   - Personal identifiable information (PII)

2. **Review Before Pushing**
   - Always review all files before pushing to public repositories
   - Verify `.gitignore` is working correctly
   - Check that environment files are excluded
   - Scan for accidentally included secrets

3. **Use Private Repositories for Sensitive Code**
   - For proprietary or confidential code, always use private repositories
   - Configure `defaultVisibility: "private"` in `deploy-config.json`

4. **Authentication Security**
   - GitHub CLI handles authentication securely
   - Tokens are stored by GitHub CLI, not this tool
   - Verify authentication: `gh auth status`
   - Use personal access tokens with minimal required scopes
   - Regularly rotate your GitHub tokens

5. **Dependency Security**
   - Keep Node.js updated to the latest LTS version
   - Regularly update GitHub CLI: `gh upgrade`
   - Run `npm audit` periodically
   - Review dependencies before installation

6. **File System Security**
   - Tool operates only within specified project directories
   - Review `deploy-config.json` paths carefully
   - Ensure proper file permissions on your system

### Known Security Limitations

1. **No Encryption**: Files are transmitted as-is to GitHub
2. **No Secret Scanning**: Tool does not scan for secrets (use GitHub's secret scanning)
3. **No Access Control**: Relies entirely on GitHub CLI authentication
4. **Irreversible Operations**: Repository creation cannot be undone automatically

## Reporting Security Vulnerabilities

**Please DO NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it privately:

### Reporting Process

1. **Email**: Send details to praashmk@gmail (add .com extension to the email address)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Response Time**: We aim to respond within 48 hours
4. **Disclosure**: Please allow reasonable time for a fix before public disclosure

### What to Expect

- Acknowledgment of your report within 48 hours
- Assessment of the vulnerability
- Timeline for a fix (if applicable)
- Credit for discovery (if desired) when the fix is released

## Security Best Practices for Contributors

If you're contributing to this project:

1. Never commit credentials or sensitive data
2. Review all code changes for security implications
3. Use parameterized commands to prevent injection
4. Validate all user inputs
5. Follow Node.js security best practices
6. Keep dependencies updated
7. Run security audits before submitting PRs

## Automated Security

We recommend users implement:

- **Pre-commit hooks** with secret detection (e.g., git-secrets, truffleHog)
- **GitHub Secret Scanning** enabled on all repositories
- **Dependabot** for automated dependency updates
- **Branch protection rules** on important repositories

## Security Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Updates and Patches

Security patches will be released as soon as possible after a vulnerability is confirmed. Update to the latest version immediately when security patches are released.

---

**Last Updated**: November 2025