# SFSpriteEditor Web

A tool for editing sprites from the MegaMan Star Force series (aka Ryuusei no Rockman series).

## Setting up

```bash
yarn
yarn build-lang
yarn dev
yarn build
```

## Extract language file

```bash
yarn extract "src/**/*.ts*" --ignore="**/*.d.ts" --out-file lang/en.json
yarn compile "lang/zh-CN.json" --ast --out-file "compiled-lang/zh-CN.json"
```
