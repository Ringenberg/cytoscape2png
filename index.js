#!/usr/bin/env node
/**
 * @fileoverview Convert a Cytograph json file to a png image.
 * @author Ringenberg@users.noreply.github.com
 */

const fs = require('fs');
const spawn = require('child_process').spawn;
const path = require('path');
const cytosnap = require('cytosnap');
const program = require('commander');
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
 * Generate the graph object by combining the specified json file, the style
 * json file, a layout (should be moved to files), and some items needed by
 * cytosnap.
 * @param {String} the pathname of the json file of the graph.
 * @returns {Promise.<Object, Error>}
 */
function make_graph(graph_pathname) {
  return Promise.all([graph_style, load_json_file(graph_pathname)])
    .then(function (args) {
      return Object.assign(
        {},
        {
          format: 'png',
          width: program.width,
          height: program.height,
          zoom: 1,
          background: 'transparent',
          resolvesTo: 'stream'
        },
        {'layout': {name: 'preset', 'fit': false, 'zoom': 1}},
        args[0], args[1]);
    });
}

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
 * Generate the image from the given graph json file.
 * @param {String} the pathname of a cytoscape json graph file.
 * @returns {Promise}
 */
function make_graph_image(graph_pathname) {
  // load graph
  //console.log('source:', graph_pathname);
  var image_pathname = make_image_pathname(graph_pathname);
  const snap = cytosnap();

  // Start snap and generate the graph object
  return Promise.all([snap.start(), make_graph(graph_pathname)])
    .then(function (args) {
      // Generate the image.
      return snap.shot(args[1]);
    }).then(function(img) {
      // Write out image to file.
      return new Promise(function(resolve, reject) {
        console.log('Writing image:', image_pathname);
        var out = fs.createWriteStream(image_pathname);
        img.pipe(out);
        out.on('finish',resolve).on('error',reject);
      });
    }).then(function() {
      if (program.trim) {
	console.log('Trimming image:', image_pathname);
	return new Promise(
	  (resolve,reject) =>
	    trimImage(image_pathname, image_pathname, {}, err => {
	      //console.log(err);	
	      if (err) return reject(err);
	      return resolve();
	    }));
      }
    }).then(function() { return snap.stop(); })
    .catch(function(err) { console.log(err); snap.stop(); });
}

// Run the conversion on all the images as promises.
Promise.all(program.args.map(make_graph_image))
  .catch(function(err) { console.error(err); });

module.exports = make_graph_image;
