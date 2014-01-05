
build: components index.js
	@component build --dev -o test -n build

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

.PHONY: clean
