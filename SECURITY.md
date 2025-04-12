# Security Information for FilmVault

## Handling Exposed Secrets

If you encounter an error message from GitHub saying "Push cannot contain secrets," it means that sensitive information has been detected in your Git history. This is a serious security issue that needs immediate attention.

### Immediate Actions

1. **Reset all exposed secrets immediately**:
   - **API Keys**: Revoke and regenerate any exposed API keys (TMDB, SendGrid, etc.)
   - **Database Credentials**: Change any exposed database passwords
   - **JWT Secrets**: Generate new JWT secrets for authentication

2. **Create new environment files**:
   - Never commit `.env` files with real secrets to Git
   - Use `.env.example` files as templates without real values
   - Always keep actual secret values in local `.env` files that are gitignored

### Fixing Git History

If secrets have been committed to Git history, you have a few options:

1. **GitHub Secret Scanning Unblock**:
   - Follow the URL provided in the error message to unblock the push
   - Only do this AFTER you've reset the secrets

2. **Create a New Repository**:
   - Sometimes, it's easier to create a completely new repository
   - Copy your code (excluding `.env` files with secrets)
   - Initialize a new Git repository with clean history

3. **Git History Rewriting** (Advanced):
   - Use tools like `git filter-repo` or BFG Repo Cleaner
   - This requires advanced Git knowledge
   - Be aware that this changes commit hashes and can break collaboration workflows

## Security Best Practices

1. **Environment Variables**:
   - Store all secrets in environment variables
   - Use `.env` files locally (never commit them)
   - Use environment variable services in production

2. **Secrets Management**:
   - Rotate secrets regularly
   - Use secrets management services where possible
   - Limit access to production secrets

3. **Accessing Secrets in Code**:
   - Never hardcode secrets in source code
   - Load secrets from environment variables at runtime
   - Log the presence of secrets, never the actual values

4. **Git Safeguards**:
   - Use `.gitignore` to exclude sensitive files
   - Consider using pre-commit hooks to prevent accidental commits of secrets
   - Set up GitHub Secret Scanning for your repository

## Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [Managing Environment Variables](https://12factor.net/config)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)