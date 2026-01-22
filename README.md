# convver-packwiz

A plugin for [convver](https://github.com/jmcmahon1999/convver) to add support for [packwiz](https://packwiz.infra.link/)

Example Usage:

```yaml
name: Automatic Versioning

on:
  push:
    branches:
      - main
      - master

jobs:
  version:
    runs-on: ubuntu-latest
    outputs:
        TAG: ${{ steps.convver-update.outputs.tag }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          fetch-tags: true
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Set Credentials
        run: |
          git config --global user.name "${GITHUB_ACTOR}"
          git config --global user.email "${GITHUB_ACTOR}@users.noreply.github.com"
      - run: npm set "//npm.pkg.github.com/:_authToken" ${{secrets.CONVVER_PAT}}
      - run: |
          npm install -g @jmcmahon1999/convver --@jmcmahon1999:registry=https://npm.pkg.github.com/
          npm install -g @jmcmahon1999/convver-packwiz --@jmcmahon1999:registry=https://npm.pkg.github.com/
        env:
          GITHUB_TOKEN: ${{ secrets.CONVVER_PAT }}
      - name: Convver Update
        id: convver-update
        run: |
          tag=$( convver update packwiz -q) || exit 1
          echo "tag=$tag" >> $GITHUB_OUTPUT
      - name: Push Changes
        if: steps.convver-update.outcome == 'success'
        run: git push --follow-tags
  
  build:
    needs: version
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-go@v6
        with:
          go-version: 1.23
      - run: go install github.com/packwiz/packwiz@latest
      - name: Build Modpack Distributions
        run: packwiz modrinth export
      - name: Archive Built Resources
        id: archive
        uses: actions/upload-artifact@v5
        with:
          name: build-$TAG
          path: ./dist/*
  
  release:
    needs: [version, build]
    runs-on: ubuntu-latest
    env:
        TAG: ${{ needs.version.outputs.tag }}
    steps:
      - name: Download Artifacts
        uses: actions/download-artifact@v7
        with:
            name: wheels-$TAG
            path: ./dist
      - name: Create release
        env:
          GITHUB_TOKEN: ${{ secrets.CONVVER_PAT }}
        run: |
          gh release create ${TAG/#/v} \
            './dist/*.mrpack' \
            --repo="$GITHUB_REPOSITORY" \
            --title="${TAG#v}" \
            --generate-notes \
            --fail-on-no-commits \
            --verify-tag
```