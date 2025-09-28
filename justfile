current_version := `jq -r '.version' package.json`
dry_run := "true"

export GORELEASER_CURRENT_TAG := current_version

fmt *args:
  bun run biome format --write {{args}}

typecheck:
  tsc --noEmit

version semver:
  jq '.version = "{{semver}}"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "export const version = \"{{semver}}\";" > src/version.ts
  just fmt package.json src/version.ts

build:
  just dry_run=true release

release:
  bun install
  goreleaser release --clean {{ if dry_run == "true" { "--snapshot" } else { "" } }}
  rm -f .*.bun-build
