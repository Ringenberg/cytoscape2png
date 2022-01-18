import fs from 'fs';
import test from 'ava';
import cytopng from '../index.js';
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

test('cytoscape2png', t => {
  return new Promise((resolve, reject) =>
    looksSame('test/Graph1.png', 'test/Graph1-result.png', {ignoreAntialiasing: true, antialiasingTolerance: 3}, (error, {equal}) => {
      error ? reject(error) : resolve(equal)
    })).then(t.truthy)
});
