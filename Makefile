all: instructions

instructions:
	echo "Use npm install -g http-server and then run http server in the public directory if you want to see the results. Use make build to do the bundle and make watch to watch the bundle"

build:
	browserify app.js -t brfs -o public/app.js -v

watch:
	watchify app.js -t brfs -d -o public/app.js -v


