# Security policy

## Supported version

Security fixes are applied to the latest code on the `main` branch.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose user data, credentials, infrastructure, or production services.

Instead, contact the repository owner privately through the GitHub profile associated with this repository. Include:

- a clear description of the issue
- affected component and route
- reproduction steps
- potential impact
- suggested mitigation when available

Do not include real citizen information, credentials, API tokens, or sensitive evidence in the report.

## Security boundaries

The public repository must not contain:

- Cloudflare API tokens
- GitHub personal access tokens
- passwords or private keys
- production `.env` files
- personal citizen data
- database exports with real reports
- unlicensed private datasets
- secret model or storage credentials

## Current safeguards

- Report payload sizes are bounded.
- API fields are validated before database access.
- Workflow status changes are recorded in audit history.
- Uploaded image bytes are not persisted by the hosted dashboard by default.
- GitHub CI validates the Worker bundle and runtime.
- Trained model weights are not committed.

## Production hardening checklist

Before operating at public scale, add:

- authentication and role-based access control
- rate limiting and bot protection
- evidence malware/content scanning
- face and license-plate redaction
- R2 retention and deletion policies
- audit-log access controls
- database backup and recovery procedures
- abuse reporting and moderation
- security headers and Content Security Policy review
- dependency and secret scanning

## Responsible disclosure

Please allow reasonable time to investigate and fix a reported issue before public disclosure.
