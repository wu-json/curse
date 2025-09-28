current_version := `jq -r '.version' package.json`
dry_run := "true"

build:
  GORELEASER_CURRENT_TAG=v{{current_version}} goreleaser build --clean --snapshot
  rm -f .*.bun-build

bump-and-commit-version bump_type:
  #!/usr/bin/env bash
  bun install
  new_version=$(svu {{bump_type}})
  just version $new_version
  git add -A
  git commit -m "chore(release): v$new_version"
  git tag v$new_version
  git push --follow-tags

fmt *args:
  bun run biome format --write {{args}}

current-version:
  #!/usr/bin/env bash
  echo {{current_version}}

typecheck:
  tsc --noEmit

version semver:
  jq '.version = "{{semver}}"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "export const version = \"{{semver}}\";" > src/version.ts
  just fmt package.json src/version.ts

release:
  goreleaser release --clean {{ if dry_run == "true" { "--snapshot" } else { "" } }}
  rm -f .*.bun-build
