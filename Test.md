Build your package

text
npm run build
Package your module

text
npm pack
This creates a .tgz file.

Install the package in your test app

text
cd /path/to/your-test-app
npm install /path/to/your-npm-package/your-package-name-1.0.0.tgz
Or, add this to your test app’s package.json:

json
"dependencies": {
"your-package-name": "file:../your-npm-package/your-package-name-1.0.0.tgz"
}
Then run:

text
npm install

3. Directly referencing the package folder
   You can also point your test app’s package.json directly to your package folder:

json
"dependencies": {
"your-package-name": "file:../your-npm-package"
}
Then run:

text
npm install
This is similar to npm link but uses the package folder directly.
