# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Security Considerations

### Before Using This Tool

**⚠️ IMPORTANT**: This tool performs automated file operations and GitHub interactions. Please review these security considerations:

1. **Sensitive Data Exposure**
   - This tool does NOT scan for API keys, secrets, or credentials
   - YOU are responsible for ensuring no sensitive data is in components
   - Always review files before deployment
   - Use `.gitignore` properly

2. **Authentication Security**
   - GitHub CLI stores authentication tokens
   - Ensure your GitHub token has appropriate permissions
   - Use `gh auth status` to verify authentication
   - Never share your authentication tokens

3. **Code Review**
   - Always review generated repositories before making them public
   - Check all copied files and dependencies
   - Verify import path modifications are correct
   - Test deployments in private repositories first

4. **Repository Visibility**
   - Default visibility is PUBLIC in config
   - Public repositories expose your code to everyone
   - Review visibility settings before deployment
   - Be cautious with proprietary code

### Reporting a Vulnerability

If you discover a security vulnerability in this tool:

1. **DO NOT** open a public issue
2. Email the maintainer directly (provide your email in README)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (if any)

**Response Timeline:**
- Initial response: Within 5 business days
- Status update: Within 10 business days
- Resolution timeline: Varies by severity

### Security Best Practices

When using this tool:

✅ **DO:**
- Test with non-sensitive code first
- Use private repositories for testing
- Review all output before pushing
- Keep GitHub CLI and Node.js updated
- Use version control for your source project
- Maintain backups

❌ **DON'T:**
- Deploy components with hardcoded secrets
- Use with untested or unknown components
- Deploy to public repositories without review
- Share your GitHub authentication tokens
- Run without understanding the operations performed

### Secure Configuration

Review your `deploy-config.json`:
- Set appropriate default visibility
- List only necessary files in `baseFiles`
- Use specific paths, avoid wildcards
- Document your configuration choices

### Known Limitations

This tool cannot:
- Detect secrets or API keys in code
- Validate security best practices
- Audit dependencies for vulnerabilities
- Encrypt sensitive data
- Prevent accidental public exposure

**You are responsible for security of deployed code.**

---

**For general security questions**: Open an issue (non-sensitive)
**For vulnerability reports**: Contact maintainer privately