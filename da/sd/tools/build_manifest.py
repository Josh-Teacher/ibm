#!/usr/bin/env python3
"""Index student .py files for a static GitHub Pages deployment; no code execution."""
import argparse
import json
from pathlib import Path

def build(root):
    counts = {}
    for faction in ('f1', 'f2'):
        folder = root / faction
        folder.mkdir(parents=True, exist_ok=True)
        target = folder / 'manifest.json'
        old = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}
        names = {s['file']: s.get('name') for s in old.get('strategies', [])}
        strategies = []
        for path in sorted(folder.glob('*.py'), key=lambda p: p.name.casefold()):
            if path.name == '__init__.py':
                continue
            if path.is_symlink():
                raise ValueError(f'Strategy must be a regular file: {path}')
            strategies.append({'file': path.name, 'name': names.get(path.name) or path.stem.replace('_', ' ')})
        target.write_text(json.dumps({'strategies': strategies}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        counts[faction] = len(strategies)
    return counts

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    counts = build(args.root.resolve())
    print(f"Indexed {counts['f1']} strategies in f1/ and {counts['f2']} in f2/.")
    if counts['f1'] != counts['f2']:
        print('Note: the viewer requires equally sized factions before launch.')
