# sam-expand

[![ci](https://github.com/starterstack/sam-expand/actions/workflows/ci.yml/badge.svg)](https://github.com/starterstack/sam-expand/actions/workflows/ci.yml)
![nycrc config on GitHub](https://img.shields.io/nycrc/starterstack/sam-expand?label=coverage)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

A tool to give sam templates more power.

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
