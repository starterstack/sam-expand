# sam-expand

[![Socket Badge](https://socket.dev/api/badge/npm/package/@starterstack/sam-expand)](https://socket.dev/npm/package/@starterstack/sam-expand)
[![npm version](https://img.shields.io/npm/v/@starterstack/sam-expand.svg?style=flat)](https://www.npmjs.com/package/@starterstack/sam-expand)
[![ci](https://github.com/starterstack/sam-expand/actions/workflows/ci.yml/badge.svg)](https://github.com/starterstack/sam-expand/actions/workflows/ci.yml)
![npm](https://img.shields.io/npm/dm/@starterstack/sam-expand)
![nycrc config on GitHub](https://img.shields.io/nycrc/starterstack/sam-expand?label=coverage)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://commitizen.github.io/cz-cli/)

A tool to give [sam](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) templates more power.

### Example usage 🚀

```sh
npm install @starterstack/sam-expand
npx sam-expand build
npx sam-expand deploy
```

### Plugins 🤖

All plugins must be ESM compatible, either as relative javascript .mjs / typescript .mts files, or as a published npm module.

- [@starterstack/sam-expand/plugins/esbuild-node](https://starterstack.github.io/sam-expand/modules/plugins_esbuild_node.html)
- [@starterstack/sam-expand/plugins/parameter-overrides](https://starterstack.github.io/sam-expand/modules/plugins_parameter_overrides.html)
- [@starterstack/sam-expand/plugins/run-script-hooks](https://starterstack.github.io/sam-expand/modules/plugins_run_script_hooks.html)

See [starterstack](https://github.com/starterstack/starterstack) for use with custom plugins

- [git.mjs](https://github.com/starterstack/starterstack/blob/main/packages/git.mjs)
- [stack-stage-config.mjs](https://github.com/starterstack/starterstack/blob/main/packages/stack-stage-config.mjs)
- [slic-watch-plugin.mts](https://github.com/starterstack/starterstack/blob/main/packages/slic-watch-plugin.mts)

### TypeDocs 📄

https://starterstack.github.io/sam-expand

### Git commits 🔧

Commit messages are [Commitizen friendly](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly)

`npx cz` or `npm run cz` should be used instead of `git commit`

### License

[Apache License, Version 2.0](LICENSE)
