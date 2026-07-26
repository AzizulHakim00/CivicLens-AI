# Contributing to CivicLens AI

Thank you for improving CivicLens AI. Contributions should preserve the project's focus on reliable civic reporting, responsible machine learning, privacy, and deployable software quality.

## Before you start

- Search existing issues and pull requests.
- Open an issue before making a large architectural change.
- Do not commit credentials, personal data, production database exports, proprietary datasets, or trained model weights without a clear license.
- Do not present demo values as measured model results.

## Development setup

```bash
git clone https://github.com/AzizulHakim00/CivicLens-AI.git
cd CivicLens-AI
npm ci
npm run dev
```

For the optional AI service:

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Required checks

Before opening a pull request, run:

```bash
npm run lint
npm test
npx wrangler deploy --dry-run
```

For Python changes:

```bash
pytest ai-service/tests -q
```

## Branch and commit style

Use a focused branch name:

```text
feature/map-filtering
fix/report-validation
docs/deployment-guide
```

Write clear commit messages in the imperative style:

```text
Add duplicate-report distance check
Fix D1 status-history insert
Document ONNX export workflow
```

## Pull request checklist

- [ ] The change has a clear purpose.
- [ ] Lint and tests pass.
- [ ] Cloudflare Worker dry-run passes.
- [ ] New behavior has tests where practical.
- [ ] Documentation is updated.
- [ ] No secret or personal data is included.
- [ ] ML claims are supported by measured results.
- [ ] UI changes remain responsive and keyboard accessible.

## Data and model contributions

Dataset contributions must include:

- source and license
- consent or collection basis
- geographic coverage
- class distribution
- annotation format
- known biases and limitations
- train/validation/test split method

Model contributions must include:

- exact training configuration
- dataset version
- evaluation split
- per-class precision and recall
- mAP50 and mAP50-95
- inference hardware and latency
- failure-case analysis

## Reporting bugs

Include:

- steps to reproduce
- expected behavior
- actual behavior
- browser or runtime version
- relevant logs with secrets removed
- screenshot when useful

## Code of conduct

Be respectful, specific, and constructive. Harassment, discrimination, or abusive communication is not accepted.
