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

/**
 * Generate the graph image given the path to the json graph representation.
 * @param {String} the pathname of the graph json file.
 */
async function gen_graph(graph_pathname) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {width: program.width+8, height: program.height+8}
  });
  const page = await browser.newPage();
  await page.setContent('<html><body><div id="graph"></div></body></html>');
  await page.addStyleTag({content: `#graph { width: ${program.width}; height: ${program.height}; box-sizing: border-box; }`});
  await page.addScriptTag({path: path.resolve(__dirname, 'node_modules/cytoscape/dist/cytoscape.min.js')});
  //let graph_style_json = await graph_style;
  const graph_json = await load_json_file(graph_pathname);
  //let obj = JSON.stringify(Object.assign(
  //  {},
  //  {'layout': { name: 'preset', 'fit': false, 'zoom': 1}},
  //  graph_sj, graph_json));
  await page.addScriptTag({content: `var cy = cytoscape({
container: document.getElementById('graph'),
elements: ${JSON.stringify(graph_json.elements)},
layout: ${JSON.stringify(graph_json.layout)},
style: ${JSON.stringify(graph_json.style)}});`});

  const image_pathname = make_image_pathname(graph_pathname);
  await page.screenshot({path: image_pathname, fullPage: true, omitBackground: true});
  if (program.trim) {
    await new Promise(
      (resolve,reject) =>
        trimImage(image_pathname, image_pathname, {}, err => {
          //console.log(err);
          if (err) return reject(err);
          return resolve();
        }));
  }
  return browser.close();
}

// Run the conversion on all the images as promises.
Promise.all(program.args.map(gen_graph))
  .catch(function(err) { console.error(err); });

module.exports = gen_graph;
