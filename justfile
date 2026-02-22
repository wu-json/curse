current_version := `jq -r '.version' package.json`
dry_run := "true"

build:
  GORELEASER_CURRENT_TAG=v{{current_version}} goreleaser build --clean --snapshot
  rm -f .*.bun-build

test:
  bun test

bump-and-commit-version bump_type:
  #!/usr/bin/env bash
  bun install
  new_version=$(svu {{bump_type}})
  just version $new_version
  git add -A
  git commit -m "chore(release): v$new_version"
  git tag -a v$new_version -m "Release v$new_version"
  git push --follow-tags

fmt *args:
  bun run oxfmt --write {{args}}

lint:
  bun run oxlint

lint-fix:
  bun run oxlint --fix

current-version:
  #!/usr/bin/env bash
  echo {{current_version}}

typecheck:
  bun run tsc --noEmit

version semver:
  jq '.version = "{{semver}}"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "// This file is auto-generated. Do not edit directly.\n// Run \`just version <semver>\` to update.\nexport const version = \"{{semver}}\";" > src/generated/version.ts
  just fmt package.json src/generated/version.ts

release:
  goreleaser release --clean {{ if dry_run == "true" { "--snapshot" } else { "" } }}
  rm -f .*.bun-build
