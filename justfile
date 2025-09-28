current_version := `jq -r '.version' package.json`
dry_run := "true"

fmt *args:
  bun run biome format --write {{args}}

current-version:
  #!/usr/bin/env bash
  echo {{current_version}}

tag:
  #!/usr/bin/env bash
  if git ls-remote --exit-code --tags origin "refs/tags/v{{current_version}}" >/dev/null 2>&1; then
    echo "Tag v{{current_version}} already exists on remote, skipping..."
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
  goreleaser build --clean --snapshot

release:
  bun install
  GORELEASER_CURRENT_TAG={{current_version}} goreleaser release --clean {{ if dry_run == "true" { "--snapshot" } else { "" } }}
  rm -f .*.bun-build
