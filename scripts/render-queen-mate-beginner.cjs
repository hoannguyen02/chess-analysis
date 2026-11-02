// Local editorial audit of the same protected catalogs used by WorksheetBuilder.
// The access stub is confined to this offline harness; API guards are unchanged.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
let chess;
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file))
    file += fs.existsSync(file + '.ts') ? '.ts' : '.json';
  if (cache.has(file)) return cache.get(file).exports;
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (file.endsWith('/server/practice-access.ts'))
    return { requirePracticeAccess: () => true };
  const mod = { exports: {} };
  cache.set(file, mod);
  const local = (id) => {
    if (id === 'chess.js') return chess;
    if (id.startsWith('@/')) return load('src/' + id.slice(2));
    if (id.startsWith('.')) return load(path.join(path.dirname(file), id));
    return require(id);
  };
  new Function(
    'module',
    'exports',
    'require',
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText
  )(mod, mod.exports, local);
  return mod.exports;
}
(async () => {
  chess = await import('chess.js');
  const model = load('src/lib/chess/worksheet.ts');
  const topic = model
    .worksheetTopicsFromLibrary(
      load('src/lib/server/private-hub.ts').privatePages
    )
    .find((t) => t.id === 'queen-mate');
  const category = load('src/lib/server/queen-mate-exercises.json')[0];
  const exercises = category.exercises;
  const pages = model.planWorksheet(
    [{ id: 0, topic: topic.id, level: 'Beginner', count: 24 }],
    { [topic.id]: exercises },
    [topic]
  );
  global.fetch = async (url) => {
    const data = fs.readFileSync('public' + url);
    return {
      ok: true,
      arrayBuffer: async () =>
        data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    };
  };
  const files = await load(
    'src/lib/chess/worksheet-pdf.ts'
  ).createWorksheetPdfs(
    pages,
    'CHIẾU HẾT BẰNG HẬU · NHẬP MÔN',
    undefined,
    'LIMA Chess',
    {
      ...model.defaultBookOptions,
      introduction: {
        title: 'Chiếu hết bằng Hậu với quân hỗ trợ',
        body:
          category.description +
          '\n\n' +
          'Mỗi thế cờ trong tập này yêu cầu chiếu hết trong một nước. Vua, Xe, Tượng, Mã hoặc Tốt hỗ trợ bằng cách bảo vệ Hậu hoặc khống chế ô thoát của Vua đối phương.\n\n' +
          'Xác định bên đến lượt và chọn nước chiếu bằng Hậu. Kiểm tra xem Vua đối phương còn ô thoát hoặc có thể bắt Hậu không. Ghi nước đi dưới bàn cờ, rồi đối chiếu lời giải. Một thế cờ có thể có nhiều nước chiếu hết.',
      },
    }
  );
  fs.mkdirSync('output/pdf', { recursive: true });
  fs.writeFileSync(
    'output/pdf/queen-mate-beginner-worksheet.pdf',
    files.worksheet
  );
  fs.writeFileSync('output/pdf/queen-mate-beginner-answers.pdf', files.answers);
  console.log(
    'Exported 24 Beginner positions and solutions through the shared PDF generator.'
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
