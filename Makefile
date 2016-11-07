NODE_PATH := $(shell npm bin)

all: server.js

$(NODE_PATH)/tsc:
	npm install

%.js: %.ts $(NODE_PATH)/tsc
	$(NODE_PATH)/tsc

dev:
	node_restarter '**/*.js' '!node_modules/**/*.js' 'node bin/metry --port 8365 -v'
