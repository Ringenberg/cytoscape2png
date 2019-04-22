import fs from 'fs';
import test from 'ava';
const cytopng = require('../index.js');
import looksSame from 'looks-same';

test.before('Generate Graph1', async t => {
  if (fs.existsSync('test/Graph1.png')) {
    fs.unlinkSync('test/Graph1.png')
  }
  await cytopng(['test/Graph1.json']);
});
test.after('Cleanup product', t => {
  if (fs.existsSync('test/Graph1.png')) {
    fs.unlinkSync('test/Graph1.png')
  }
});

test.cb('cytoscape2png', t => {
  looksSame('test/Graph1.png', 'test/Graph1-result.png', t.end);
});
