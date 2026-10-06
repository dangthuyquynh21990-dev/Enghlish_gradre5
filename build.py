"""Ghép các file trong src/ thành index.html (chạy: python3 build.py)."""
import pathlib
src=pathlib.Path('src')
head=(src/'head.html').read_text(encoding='utf-8')
i=head.index('</style>')+8
order=['audio.js','data.js','units_a.js','units_b.js','units_c.js','units_d.js','adv_a.js','adv_b.js','adv_c.js','adv_d.js','app4.js']
js=''.join((src/f).read_text(encoding='utf-8')+'\n' for f in order)
html=('<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
 '<style>html{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n'
 +head[:i]+'\n</head>\n<body>\n<div class="app" id="app"></div>\n<script>\n'+js+'</script>\n</body>\n</html>\n')
pathlib.Path('index.html').write_text(html,encoding='utf-8')
print('Đã tạo index.html',len(html)//1024,'KB')
