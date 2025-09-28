current_version := `jq -r '.version' package.json`
dry_run := "true"

export GORELEASER_CURRENT_TAG := current_version

fmt *args:
  bun run biome format --write {{args}}

tag:
  #!/usr/bin/env bash
  if git rev-parse "v{{current_version}}" >/dev/null 2>&1; then
    echo "Tag v{{current_version}} already exists, skipping..."
  else
    git tag v{{current_version}}
    git push origin v{{current_version}}
  fi

typecheck:
  tsc --noEmit

version semver:
  jq '.version = "{{semver}}"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "export const version = \"{{semver}}\";" > src/version.ts
  just fmt package.json src/version.ts

build:
  just release

release:
  bun install
  goreleaser release --clean {{ if dry_run == "true" { "--snapshot" } else { "" } }}
  rm -f .*.bun-build
