.PHONY: install dev build test test-watch test-coverage lint clean nuke push run-cloud run-local

## Install dependencies
install:
	npm install

## Start dev server
dev:
	npm run start

## Production build
build:
	npm run build

## Run tests once
test:
	CI=true npm test

## Run tests in watch mode
test-watch:
	npm test

## Run tests with coverage report
test-coverage:
	CI=true npm test -- --coverage

## Lint via eslint
lint:
	npx eslint src/

## Remove build artifacts and coverage
clean:
	rm -rf build coverage

## Full reset: remove node_modules, lock files, and reinstall
nuke: clean
	rm -rf node_modules package-lock.json bun.lock
	npm install

run-cloud:
	sh ./run-cloud.sh

run-local:
	sh ./run-local.sh
