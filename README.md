# cytoscape2png
Command line tool for converting Cytograph json graph files to png images
with an optional Cytograph style json file which is applied to all of the
graphs.

## Usage
To install, use `npm install Ringenberg/cytoscape2png`.
This should make `./node_modules/.bin/cytoscape2png` available,
otherwise use `./node_modules/cytoscape2png/index.js` in its place.

Please note that all of the .json files passed to this script need to be well formed JSON.

To generate a single image from a fully specified JSON file:
```shell
$ cytoscape2png path/to/graph.json
```

To generate all of the images for all of the specified graphs:
```shell
$ cytoscape2png path/to/images/graph*.json
```
will produce the corresponding images for each graph with the ".json" extention replaced by ".png"

To generate images with a common style:
```shell
$ cytoscape2png --style graph_style.json graph*.json
```
will generate all of the given graphs using the provided JSON style file
as specified in http://js.cytoscape.org/#style - Plain JSON format.
