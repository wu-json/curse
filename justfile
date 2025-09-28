current_version := `jq -r '.version' package.json`
dry_run := "true"

fmt *args:
  bun run biome format --write {{args}}

typecheck:
  tsc --noEmit

version semver:
  jq '.version = "{{semver}}"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "export const version = \"{{semver}}\";" > src/version.ts
  just fmt package.json src/version.ts

release:
    #!/usr/bin/env bash
    export GORELEASER_CURRENT_TAG={{current_version}}
    if [ "{{dry_run}}" = "true" ]; then
        goreleaser release --snapshot --clean
    else
        goreleaser release --clean
    fi
    rm -f .*.bun-build
