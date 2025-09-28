current_version := `jq -r '.version' package.json`
dry_run := "true"

fmt *args:
  bun run biome format --write {{args}}

checkout-release:
  git checkout -b "release-v{{current_version}}" "v{{current_version}}"

current-version:
  #!/usr/bin/env bash
  echo {{current_version}}

tag:
  #!/usr/bin/env bash
  if ! git rev-parse "v{{current_version}}" >/dev/null 2>&1; then
    git tag v{{current_version}}
    git push origin v{{current_version}}
  else
    echo "Tag v{{current_version}} already exists, skipping..."
  fi

typecheck:
  tsc --noEmit

version semver:
  jq '.version = "{{semver}}"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "export const version = \"{{semver}}\";" > src/version.ts
  just fmt package.json src/version.ts

build:
  GORELEASER_CURRENT_TAG=v{{current_version}} goreleaser build --clean --snapshot

release:
  bun install
  goreleaser release --clean {{ if dry_run == "true" { "--snapshot" } else { "" } }}
  rm -f .*.bun-build
