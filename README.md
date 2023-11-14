# sam-expand

A tool to give sam templates more power.

### Example usage

```sh
npm install @starterstack/sam-expand
npx sam-expand sam build
npx sam-expand sam package
npx sam-expand sam deploy \
  --guided \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
```

### Git commits

Commit messages are [Commitizen friendly](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly)

`npx cz` or `npm run cz` should be used instead of `git commit`

### License

[Apache License, Version 2.0](LICENSE)
