const { exec } = require('child_process');

const pkj = require('./package.json');

const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const fs = require('fs');
const fse = require('fs-extra');

const mkdirp = require('mkdirp');

const fil = `\u001b[1;35m[fil] `;

const targets = ['production', 'editor'];

const env = process.env.ELEVENTY_ENV ? process.env.ELEVENTY_ENV.split(':') : [];
const isProduction = env.indexOf('production') > -1;

if (!isProduction) {
	console.log('Running server...');
	exec('node ./server/server.js');
}

try {
	for (const target of targets) {
		mkdirp.sync(`public/${target}`);
		mkdirp.sync(`bundle/${target}`);
		mkdirp.sync(`public/uploads`);
	}

	mkdirp.sync(`uploads`);
	mkdirp.sync(`uploads/data`);
	// Add folders you need here
	/*mkdirp.sync(`uploads/glb`);
	mkdirp.sync(`uploads/scene`);
	mkdirp.sync(`uploads/textures`); */
} catch (e) {}

const sass = require('sass');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const CleanCSS = require('clean-css');

const esbuild = require('esbuild');
const alias = require('esbuild-plugin-alias');
const chokidar = require('chokidar');

const buildJS = (target, resolve, reject) => {
	const OUT_JS = `tmp/${target}/main.js`;

	esbuild
		.build({
			entryPoints: [`src/js/${target}/main.js`],
			bundle: true,
			minify: isProduction,
			sourcemap: false,
			target: 'es6',
			define: {
				DEV_MODE: !isProduction,
				TARGET_MODE: JSON.stringify(target),
				VERSION: JSON.stringify(pkj.version),
			},
			loader: { '.glsl': 'text', '.vert': 'text', '.frag': 'text' },
			outfile: OUT_JS,
			plugins: [
				alias({
					three: __dirname + '/node_modules/three/build/three.min.js',
				}),
			],
		})
		.catch(() => {
			resolve();
		})
		.then(() => {
			resolve();
		});
};

const buildCSS = (target) => {
	const OUT_CSS = `bundle/${target}/main.css`;

	console.log(`Building ${target}.css ...`);

	const result = sass.compile(`src/styles/${target}.scss`);
	postcss([autoprefixer])
	.process(result.css, {
		from: `src/styles/${target}.scss`,
		to: OUT_CSS,
	})
	.then((result) => {
		const finalCSS = !isProduction ? result.css : new CleanCSS({}).minify(result.css).styles;

		fs.writeFile(OUT_CSS, finalCSS, (error) => {
			if (error) console.log(error);
		});
	});
};

const buildAllJS = () => {
	// fer temp, tot promise i en acabar copiar tmp a OUT_JS per disparar el reload d'11ty
	const OUT_TMP = 'tmp';
	mkdirp.sync(OUT_TMP);
	let promises = [];
	for (const target of targets) {
		promises.push(
			new Promise((resolve, reject) => {
				buildJS(target, resolve, reject);
			})
		);
	}

	Promise.all(promises).then((values) => {
		for (const target of targets) {
			fs.rename(`tmp/${target}/main.js`, `bundle/${target}/main.js`, () => {
				console.log(`${fil}Bundle ${target} complete \u001b[0m`);
			});
		}
		fs.access('tmp', (err) => {
			if (!err) fs.rmSync('tmp', { recursive: true, force: true });
		});
	});

	// copiar tmp a bundle
};

const buildAllCSS = () => {
	for (const target of targets) buildCSS(target);
};

if (!isProduction) {
	chokidar.watch('src/js').on('change', (path, file) => {
		console.log(`${fil}JS Updated [${path}]`);
		buildAllJS();
	});
	chokidar.watch('src/glsl').on('change', (path, file) => {
		console.log(`${fil}GLSL Updated [${path}]`);
		buildAllJS();
	});
	chokidar.watch('src/styles').on('change', (path, file) => {
		console.log(`${fil}CSS Updated [${path}]`);
		buildAllCSS();
	});
}

buildAllCSS();
buildAllJS();

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(syntaxHighlight);

	eleventyConfig.setUseGitIgnore(false);

	eleventyConfig.setBrowserSyncConfig({
		ghostMode: false,
	});

	eleventyConfig.setWatchJavaScriptDependencies(false);

	eleventyConfig.addNunjucksFilter('timestamp', (src) => {
		return `${src}?v=${Date.now()}`;
	});

	eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });

	if (isProduction) {
		eleventyConfig.addPassthroughCopy({ uploads: 'uploads' });
	
	}	else {
		console.log('Copying Uploads...');
		fse.copySync(`${__dirname}/uploads`, `${__dirname}/public/uploads`, {
			overwrite: true,
			recursive: true
		});
	}

	for (const target of targets) {
		const path = {};
		path[`bundle/${target}`] = `${target}/bundle`;
		eleventyConfig.addPassthroughCopy(path);
	}

	return {
		dir: {
			data: '../../data',
			input: `src/site/pages`,
			includes: '../partials',
			layouts: '../base',
			output: `public/`,
		},
		templateFormats: ['njk'],
		htmlTemplateEngine: 'njk',
	};
};
