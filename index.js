#!/usr/bin/env node
/**
 * @fileoverview Convert a Cytograph json file to a png image.
 * @author Ringenberg@users.noreply.github.com
 */

import { readFile } from 'fs/promises';
import { resolve as _resolve, extname, format, parse } from 'path';
import { launch } from 'puppeteer';
import sharp from 'sharp';
import pkg from './package.json' with { type: 'json' };

//console.log(program.args,parseInt(program.width),program.height);

/**
 * Tests if the given string is not empty.
 * @param {String} a string
 * @returns {Boolean}
 */
function q_empty_pathname(pathname) {
  // needed because params get messed up in ava testing environment
  return !(
    pathname &&
    (typeof pathname === 'string' || pathname instanceof String) &&
    pathname !== '' &&
    pathname !== 'undefined'
  );
}

/**
 * Read in a json file and parse it.
 * @param {String} a pathname indicating the json file.
 *       It must have a .json extension.
 * @returns {Promise.<Object, Error>} Returns the parsed json object.
 */
async function load_json_file(json_pathname) {
  try {
    if (q_empty_pathname(json_pathname)) return {};
    if (extname(json_pathname) !== '.json') {
      throw new Error(`${json_pathname} is not a json file.`);
    }
    console.log('Reading:', json_pathname);
    const data = await readFile(json_pathname);
    return JSON.parse(data);
  } catch (err) {
    return console.error(err);
  }
}

/**
 * Given the graph pathname, generate the corresponding image name.
 * The image name will be the same as the graph pathname,
 * just with a .png extension.
 * @param {String} the pathname of the graph json file.
 */
function make_image_pathname(graph_pathname) {
  const graph_path = parse(graph_pathname);
  const image_path = Object.assign({}, graph_path);
  delete image_path.base;
  image_path.ext = '.png';
  return format(image_path);
}

/*eslint max-statements: ["error", 12, { "ignoreTopLevelFunctions": true }]*/
/**
 * Generate the graph image given the path to the json graph representation.
 * @param the browser instance to use.
 * @param {String} the pathname of the graph json file.
 * @param command line options.
 */
async function gen_graph(browser, graph_pathname, options) {
  if (q_empty_pathname(graph_pathname)) {
    return;
  }
  const page = await browser.newPage();
  await page.setContent('<html><body><div id="graph"></div></body></html>');
  await page.addStyleTag({
    content: `#graph { width: ${options?.width ?? 500}; height: ${options?.height ?? 500}; box-sizing: border-box; }`,
  });
  await page.addScriptTag({
    path: _resolve(
      import.meta.dirname,
      'node_modules/cytoscape/dist/cytoscape.min.js',
    ),
  });
  const cy_graph = Object.assign(
    {},
    { layout: { name: 'preset', fit: false, zoom: 1 } },
    await load_json_file(options?.style),
    await load_json_file(graph_pathname),
  );
  await page.addScriptTag({
    content: `var cy = cytoscape({
container: document.getElementById('graph'),
elements: ${JSON.stringify(cy_graph.elements)},
layout: ${JSON.stringify(cy_graph.layout)},
style: ${JSON.stringify(cy_graph.style)}});`,
  });

  const image_pathname = make_image_pathname(graph_pathname);
  console.log(`Writing ${image_pathname}...`);
  const screenshot = await page.screenshot({
    // path: image_pathname,
    fullPage: true,
    omitBackground: true,
  });
  //    if (trim) {
  //      await new Promise((resolve, reject) =>
  //        trimImage(image_pathname, image_pathname, {}, (err) => {
  //          if (err) return reject(err);
  //          return resolve();
  //        })
  //      );
  //    }
  await sharp(screenshot).trim().toFile(image_pathname);
}

/**
 * Generate the images from a list of Cytoscape json files.
 * @param {[String]} pathnames of Cytoscape json files.
 */
async function gen_images(graph_files, options) {
  // create browser that is a bit bigger than the the desired image.
  const browser = await launch({
    headless: true,
    defaultViewport: {
      width: options?.width ?? 500,
      height: options?.height ?? 500,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-shandbox',
      '--disable-dev-shm-usage',
    ],
  });

  // Run the conversion on all the images as promises.
  await Promise.all(
    graph_files.map((file) => gen_graph(browser, file, options)),
  ).catch((err) => {
    console.error(err);
  });
  return browser.close();
}

if (process.argv[1] === import.meta.filename) {
  // Process command line parameters.
  const command = await import('commander');
  const program = new command.Command();
  program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version ?? 'UNKNOWN')
    .option(
      '-s, --style [value]',
      'A json file containing the Cytoscape style data to use for the images.',
      '',
    )
    .option(
      '-w, --width <n>',
      'Sets the initial viewport width.',
      (n) => parseInt(n),
      500,
    )
    .option(
      '-h, --height <n>',
      'Sets the initial viewport height.',
      (n) => parseInt(n),
      500,
    )
    //  .option('-T, --no-trim', 'Do not trim image')
    .argument('<files...>')
    .parse();
  const options = program.opts();
  gen_images(program.args, options);
}

export default gen_images;
