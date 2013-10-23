all: instructions

instructions:
	echo "Use 'npm install -g http-server' and then run http server in the public directory if you want to see the results."
	echo "Use 'make build' to do the bundle"
	echo "Use 'make watch' to watch the bundle and build with source maps"


build:
	browserify app.js -t brfs -o public/app.js -v

watch:
	watchify app.js -t brfs -d -o public/app.js -v


