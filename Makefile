BIN := node_modules/.bin

all: server.js

$(BIN)/tsc:
	npm install

%.js: %.ts $(BIN)/tsc
	$(BIN)/tsc

dev:
	node_restarter '**/*.js' '!node_modules/**/*.js' 'node bin/metry --port 8365 -v'
