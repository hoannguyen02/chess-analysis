const test = require('node:test');
const assert = require('node:assert/strict');
const { options, renderBatch } = require('./render-tactic-batch.cjs');

test('batch renderer fails closed for unsupported topics and ambiguous selections', async () => {
  assert.throws(() => options(['--topic', 'unimplemented', '--ids', 'a', '--output-dir', '/tmp/none']), /adapter/);
  await assert.rejects(renderBatch({topic:'discovery', ids:['same','same'], outputDir:'/tmp/none'}), /distinct/);
});

test('batch renderer honors current owner-filtered catalog and refuses missing IDs', async () => {
  for (const topic of ['discovery', 'fork'])
    await assert.rejects(renderBatch({topic, ids:['not-an-approved-game'], outputDir:'/tmp/none'}), /unavailable after current owner decisions/);
});
