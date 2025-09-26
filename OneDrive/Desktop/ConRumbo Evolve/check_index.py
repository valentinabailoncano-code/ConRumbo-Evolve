from pathlib import Path
text = Path('frontend/index.html').read_text(encoding='utf-8')
print('Mantén presionado para hablar' in text)
print(text.splitlines()[57])
