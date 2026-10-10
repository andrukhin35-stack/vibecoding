import glob, os, sys

d = "C:/Users/Usser/Desktop/vibecoding/qwen_code/.qwen/pytasks"
files = sorted(glob.glob(os.path.join(d, "*.py")))
print("файлов:", len(files))
fails = 0
for f in files:
    try:
        src = open(f, encoding="utf-8").read()
        compile(src, os.path.basename(f), "exec")
    except SyntaxError as e:
        fails += 1
        print("SYNTAX:", os.path.basename(f), "->", e)
print("ошибок синтаксиса:", fails)