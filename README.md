# sam-expand

[![Socket Badge](https://socket.dev/api/badge/npm/package/@starterstack/sam-expand)](https://socket.dev/npm/package/@starterstack/sam-expand)
[![npm version](https://img.shields.io/npm/v/@starterstack/sam-expand.svg?style=flat)](https://www.npmjs.com/package/@starterstack/sam-expand)
[![ci](https://github.com/starterstack/sam-expand/actions/workflows/ci.yml/badge.svg)](https://github.com/starterstack/sam-expand/actions/workflows/ci.yml)
[![typedoc](https://github.com/starterstack/sam-expand/actions/workflows/typedoc.yml/badge.svg)](https://github.com/starterstack/sam-expand/actions/workflows/typedoc.yml)
![nycrc config on GitHub](https://img.shields.io/nycrc/starterstack/sam-expand?label=coverage)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://commitizen.github.io/cz-cli/)

A tool to give [sam](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) templates more power.

### Example usage

```sh
npm install @starterstack/sam-expand
npx sam-expand build
npx sam-expand package
npx sam-expand deploy \
  --guided \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
```

### Git commits

Commit messages are [Commitizen friendly](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly)

`npx cz` or `npm run cz` should be used instead of `git commit`

### License

[Apache License, Version 2.0](LICENSE)
