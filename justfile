dryrun := "true"

typecheck:
  tsc --noEmit

gen-version:
  echo "export const version = \"$(jq -r .version package.json)\";" > src/version.ts

release:
    #!/usr/bin/env bash
    if [ "{{dryrun}}" = "true" ]; then
        goreleaser release --snapshot --clean
    else
        goreleaser release --clean
    fi
