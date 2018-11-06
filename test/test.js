const mic = require('mocha-image-compare')({});
const assert = require('assert');
const cytopng = require('../index.js');
const fs = require('fs');

describe('cytoscape2png', function() {
  this.timeout(0);
  before('Generate Graph1.png', async function() {
    if (fs.existsSync('test/Graph1.png')) {
      fs.unlinkSync('test/Graph1.png')
    }
    await cytopng('test/Graph1.json');
    return
  });
  it('Graph1', function(done) {
    let compare = mic.test(this);
    compare('test/Graph1.png', 0.001, 'test/Graph1-result.png', done);
  });
});
