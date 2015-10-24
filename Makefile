BIN := node_modules/.bin
DTS := lodash/lodash moment/moment-node node/node

all: server.js

type_declarations: $(DTS:%=type_declarations/DefinitelyTyped/%.d.ts)
type_declarations/DefinitelyTyped/%:
	mkdir -p $(@D)
	curl -s https://raw.githubusercontent.com/borisyankov/DefinitelyTyped/master/$* > $@

$(BIN)/tsc:
	npm install

%.js: %.ts type_declarations $(BIN)/tsc
	$(BIN)/tsc
