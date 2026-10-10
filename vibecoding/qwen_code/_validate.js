const fs = require("fs");
const vm = require("vm");
const path = require("path");
const p = "C:/Users/Usser/Desktop/vibecoding/qwen_code/index.html";
const html = fs.readFileSync(p, "utf8");

let errors = [];

// 1. Компиляция всего JS-скрипта приложения
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) errors.push("Нет <script> блока");
scripts.forEach((src, i) => {
  try { new vm.Script(src, { filename: "app-script-" + i + ".js" }); }
  catch (e) { errors.push("JS compile error: " + e.message); }
});
console.log("JS скриптов скомпилировано:", scripts.length);

// 2. Извлечение COURSE и структурная валидация
const startMark = "const COURSE = ";
const si = html.indexOf(startMark);
const ei = html.indexOf("\n];", si);
const courseText = html.slice(si + startMark.length, ei) + "\n]";
let COURSE = null;
try { COURSE = eval("(" + courseText + ")"); }
catch (e) { errors.push("COURSE eval error: " + e.message); }

if (COURSE) {
  const ids = new Set();
  let lessonTotal = 0, taskTotal = 0;
  const typeCount = {};
  COURSE.forEach((ch, ci) => {
    if (!ch || !Array.isArray(ch.lessons) || !ch.lessons.length) { errors.push("Глава " + (ci + 1) + ": нет lessons"); return; }
    ch.lessons.forEach((l, li) => {
      lessonTotal++;
      if (ids.has(l.id)) errors.push("Дубль id урока: " + l.id);
      ids.add(l.id);
      if (!l.title) errors.push(l.id + ": нет title");
      if (!Array.isArray(l.content) || !l.content.length) errors.push(l.id + ": нет content");
      if (!Array.isArray(l.tasks) || !l.tasks.length) errors.push(l.id + ": нет tasks");
      l.tasks.forEach((t, ti) => {
        taskTotal++;
        typeCount[t.type] = (typeCount[t.type] || 0) + 1;
        const where = l.id + " task#" + (ti + 1) + " (" + t.type + ")";
        if (t.type === "mcq") {
          if (!Array.isArray(t.options) || typeof t.answer !== "number" || t.answer < 0 || t.answer >= t.options.length) errors.push(where + ": answer вне диапазона или нет options");
        } else if (t.type === "code") {
          if (typeof t.starter !== "string") errors.push(where + ": нет starter");
          if (!Array.isArray(t.tests) || !t.tests.length) errors.push(where + ": нет tests");
          t.tests.forEach((tt) => { if (typeof tt.t !== "string" || !tt.t.trim()) errors.push(where + ": пустой тест"); });
        } else if (t.type === "fill") {
          if (!Array.isArray(t.expected) || !t.expected.length) errors.push(where + ": нет expected");
        } else {
          errors.push(where + ": неизвестный тип");
        }
      });
    });
  });
  console.log("Глав:", COURSE.length, "| Уроков:", lessonTotal, "| Заданий:", taskTotal, "| По типам:", JSON.stringify(typeCount));
  if (lessonTotal !== 49) errors.push("Ожидалось 49 уроков, а теперь " + lessonTotal);
}

// 3. Экспорт python-сниппетов для компиляции
function wrapForCheck(userCode, setup, tests) {
  let body = "import io as __io, sys as __sys\n__out = __io.StringIO()\n__sys.stdout = __out\n";
  if (setup) body += "\n" + setup + "\n";
  body += "\n" + userCode + "\n";
  body += "\n__checks = []\n";
  tests.forEach(ti => {
    body += "try:\n    " + String(ti.t).split("\n").join("\n    ") + "\n    __checks.append(('ok',''))\n";
    body += "except Exception as __e:\n    __checks.append(('fail', type(__e).__name__ + ': ' + str(__e)))\n";
  });
  return body;
}

if (COURSE) {
  const outDir = "C:/Users/Usser/Desktop/vibecoding/qwen_code/.qwen/pytasks";
  fs.mkdirSync(outDir, { recursive: true });
  let n = 0;
  COURSE.forEach((ch, ci) => ch.lessons.forEach((l, li) => l.tasks.forEach((t, ti) => {
    if (t.type !== "code") return;
    const src = wrapForCheck(t.starter || "", t.setup || "", t.tests);
    fs.writeFileSync(path.join(outDir, ("t" + String(++n).padStart(3, "0") + "_" + l.id + "_" + (ti + 1) + ".py").replace(/[^a-zA-Z0-9_.-]/g, "_")), src);
  })));
  console.log("Python-сниппетов записано:", n);
}

// 4. Проверка остаточных артефактов
const bad = (html.match(/[\u200B-\u206F\uFE00-\uFE0F]/g) || []).length;
const dbl = (html.match(/,,\s*/g) || []).length;
const plane = (html.match(/плане/g) || []).length;
console.log("Остаточные: invisible=" + bad + " doubleComma=" + dbl + " plane=" + plane);

console.log(errors.length ? "ОШИБКИ:\n" + errors.join("\n") : "Структура курса валидна ✅");