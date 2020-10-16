#!/bin/bash

Q_DIR=../pkgquarantine

# Quarantine files we don't want to include in the standalone package
echo Moving your sensitive files to quarantine in $Q_DIR
mkdir -p $Q_DIR
cat .pkgignore | while read file
do
  mv $file $Q_DIR
done

echo Building standalones
yarn build-standalone

# Un-quarantine files
echo Restoring your files from quarantine
mv $Q_DIR/* .

rmdir $Q_DIR

echo Done.
