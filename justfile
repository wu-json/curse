dryrun := "true"

fmt:
  bun run biome format --write .

typecheck:
  tsc --noEmit

version semver:
  jq '.version = "{{semver}}"' package.json > package.json.tmp && mv package.json.tmp package.json
  echo "export const version = \"{{semver}}\";" > src/version.ts
  just fmt

release:
    #!/usr/bin/env bash
    if [ "{{dryrun}}" = "true" ]; then
        goreleaser release --snapshot --clean
    else
        goreleaser release --clean
    fi
