const mic = require('mocha-image-compare')({});
const assert = require('assert');
const cytopng = require('../index.js');

describe('cytoscape2png', function() {
  this.timeout(0);
  before('Generate Graph1.png', function() {
    return cytopng('test/Graph1.json');
  });
  it('Graph1', function(done) {
    let compare = mic.test(this);
    compare('test/Graph1.png', 0.001, 'test/Graph1-result.png', done);
  });
});
