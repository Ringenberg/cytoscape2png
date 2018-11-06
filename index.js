#!/usr/bin/env node
/**
 * @fileoverview Convert a Cytograph json file to a png image.
 * @author Ringenberg@users.noreply.github.com
 */

const fs = require('fs');
const path = require('path');
const program = require('commander');
const puppeteer = require('puppeteer');
const trimImage = require('trim-image');
const pkg = require('./package.json');

// Process command line parameters.
program
  .version(pkg.version)
  .option('-s, --style [value]',
          'A json file containing the Cytoscape style data to use for the images.',
          '')
  .option('-w, --width <n>', 'Sets the initial viewport width.', n=>parseInt(n), 500)
  .option('-h, --height <n>', 'Sets the initial viewport height.', n=>parseInt(n), 500)
  .option('-T, --no-trim', 'Do not trim image')
  .parse(process.argv);

//console.log(program.args,parseInt(program.width),program.height);

/**
 * Read in a json file and parse it.
 * @param {String} a pathname indicating the json file.
 *       It must have a .json extension.
 * @returns {Promise.<Object, Error>} Returns the parsed json object.
 */
function load_json_file(json_pathname) {
  return new Promise(function(resolve, reject) {
    if (json_pathname) {
      if (path.extname(json_pathname) !== '.json') {
        return reject(new Error(json_pathname + ' is not a json file'));
      }
      console.log('Reading:',json_pathname);
      fs.readFile(json_pathname,
                  function(err, data) {
                    if(err) return reject(err);
                    return resolve(data);
                  });
    } else {
      return resolve('{}');
    }
  }).then((data) => JSON.parse(data)).catch(console.error);
}

var graph_style = load_json_file(program.style);

/**
 * Given the graph pathname, generate the corresponding image name.
 * The image name will be the same as the graph pathname,
 * just with a .png extension.
 * @param {String} the pathname of the graph json file.
 */
function make_image_pathname(graph_pathname) {
  var graph_path = path.parse(graph_pathname);
  var image_path = Object.assign({}, graph_path);
  delete image_path.base;
  image_path.ext = '.png';
  return path.format(image_path);
}

/*eslint max-statements: ["error", 11, { "ignoreTopLevelFunctions": true }]*/
/**
 * Generate the graph image given the path to the json graph representation.
 * @param {String} the pathname of the graph json file.
 */
async function gen_graph(browser, trim, graph_pathname) {
  const page = await browser.newPage();
  await page.setContent('<html><body><div id="graph"></div></body></html>');
  await page.addStyleTag({content: `#graph { width: ${program.width}; height: ${program.height}; box-sizing: border-box; }`});
  await page.addScriptTag({path: path.resolve(
    __dirname, 'node_modules/cytoscape/dist/cytoscape.min.js')});
  const cy_graph = Object.assign(
    {},
    {'layout': {name: 'preset', 'fit': false, 'zoom': 1}},
    await graph_style, await load_json_file(graph_pathname));
  await page.addScriptTag({content: `var cy = cytoscape({
container: document.getElementById('graph'),
elements: ${JSON.stringify(cy_graph.elements)},
layout: ${JSON.stringify(cy_graph.layout)},
style: ${JSON.stringify(cy_graph.style)}});`});

  const image_pathname = make_image_pathname(graph_pathname);
  console.log(`Writing ${image_pathname}...`);
  await page.screenshot({path: image_pathname, fullPage: true,
                         omitBackground: true});
  if (trim) {
    await new Promise(
      (resolve,reject) =>
        trimImage(image_pathname, image_pathname, {},
                  err => { if (err) return reject(err); return resolve(); }));
  }
}

/**
 * Generate the images from a list of Cytoscape json files.
 * @param {[String]} pathnames of Cytoscape json files.
 */
async function gen_images(graph_files) {
  // create browser that is a bit bigger than the the desired image.
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {width: program.width + 8, height: program.height + 8}
  });

  // Run the conversion on all the images as promises.
  await Promise.all(graph_files.map(g_file => gen_graph(browser,program.trim,g_file)))
    .catch(err => { console.error(err); });
  return browser.close();
}

gen_images(program.args);

module.exports = gen_images;
