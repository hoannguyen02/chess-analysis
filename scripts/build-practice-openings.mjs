// Rebuild with: node scripts/build-practice-openings.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { Chess } from 'chess.js';
const root = path.resolve(__dirname, '..');
const initialFen = new Chess().fen();
const positionKey = (game) => {
  const fields = game.fen().split(' ').slice(0, 4);
  if (
    fields[3] !== '-' &&
    !game.moves({ verbose: true }).some((move) => move.flags.includes('e'))
  )
    fields[3] = '-';
  return fields.join(' ');
};
function openingPositions() {
  const positions = new Map();
  for (const letter of 'abcde') {
    const table = fs.readFileSync(
      path.join(__dirname, 'fixtures/openings', `${letter}.tsv`),
      'utf8'
    );
    for (const row of table.trim().split('\n').slice(1)) {
      const [eco, name, pgn] = row.split('\t');
      const game = new Chess();
      if (!game.load_pgn(pgn)) throw new Error(`Invalid opening: ${name}`);
      positions.set(positionKey(game), { name, eco });
    }
  }
  return positions;
}
function classify(source, positions) {
  if (source.kind !== 'game' || source.fen !== initialFen) return undefined;
  const game = new Chess();
  let opening;
  // Match the deepest named position, including transpositions, in the actual game.
  for (const move of source.lines[0] || []) {
    if (!game.move(move)) throw new Error(`Illegal source move: ${move}`);
    opening = positions.get(positionKey(game)) || opening;
  }
  return opening;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const positions = openingPositions();
  const result = {};
  for (const file of fs
    .readdirSync(path.join(root, 'src/lib/server'))
    .filter((f) => f.endsWith('-game-sources.json'))) {
    const collection = file.replace('-game-sources.json', '');
    const sources = JSON.parse(
      fs.readFileSync(path.join(root, 'src/lib/server', file))
    );
    for (const [id, source] of Object.entries(sources)) {
      const opening = classify(source, positions);
      if (opening) result[`${collection}/${id}`] = opening;
    }
  }
  fs.writeFileSync(
    path.join(root, 'src/lib/server/practice-openings.json'),
    JSON.stringify(result, null, 2) + '\n'
  );
  console.log(`Classified ${Object.keys(result).length} saved games.`);
}
export { classify, openingPositions, positionKey };
