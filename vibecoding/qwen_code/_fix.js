const fs = require("fs");
const p = "C:/Users/Usser/Desktop/vibecoding/qwen_code/index.html";
let s = fs.readFileSync(p, "utf8");
let stats = {};

function count(label, re) {
  stats[label] = (s.match(re) || []).length;
}

// 1. невидимые символы
count("invisible", /[\u200B-\u206F\uFE00-\uFE0F\u00AD]/g);
s = s.replace(/[\u200B-\u206F\uFE00-\uFE0F\u00AD]/g, "");

// 2. полная ширина -> ASCII
const fwMap = { "（": "(", "）": ")", "，": ",", "．": ".", "：": ":", "；": ";", "！": "!", "？": "?" };
count("fullwidth", /[\uFF08\uFF09\uFF0C\uFF0E\uFF1A\uFF1B\uFF01\uFF1F]/g);
s = s.replace(/[\uFF08\uFF09\uFF0C\uFF0E\uFF1A\uFF1B\uFF01\uFF1F]/g, c => fwMap[c] || c);

// 3. артефакты «плане» / «пплане»
count("plane", /пплане|плане/g);
s = s.replace(/пплане/g, "");
s = s.replace(/плане/g, "");

// 4. двойные запятые
count("doubleComma", /,,\s*/g);
s = s.replace(/,,\s*/g, ", ");
count("commaSpaceComma", /,\s*,/g);
s = s.replace(/,\s*,/g, ",");

// 5. слипшиеся слова
count("iin", /for iin range/g);
s = s.replace(/for iin range/g, "for i in range");
count("_in", /for _in range/g);
s = s.replace(/for _in range/g, "for _ in range");
count("forc", /forc in p2/g);
s = s.replace(/forc in p2/g, "for c in p2");
count("xinRange", /xin range/g);
s = s.replace(/xin range/g, "x in range");
count("xinNums", /xin nums/g);
s = s.replace(/xin nums/g, "x in nums");

// 6. точечные артефакты
s = s.replace("while i <</code>  3: i +=</code>1?", "while i < 3: i += 1?");
s = s.replace("print(i *</code>2)?", "print(i * 2)?");

fs.writeFileSync(p, s);
console.log("stats:", JSON.stringify(stats));