#!/usr/bin/env python3
"""Index student .py files for a static GitHub Pages deployment; no code execution."""
import argparse
import json
from pathlib import Path

def basename(value, extension):
    return (isinstance(value, str) and len(value) > len(extension)
            and value.endswith(extension) and '/' not in value and '\\' not in value
            and not any(ord(char) < 32 for char in value))

def validate_classes(root):
    """Validate instructor-selected memberships without rewriting their files/order."""
    catalog_path = root / 'classes' / 'index.json'
    if not catalog_path.exists():
        return
    catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
    if not isinstance(catalog.get('classes'), list):
        raise ValueError('classes/index.json needs a classes array.')
    ids = {'all', 'demo'}
    for section in catalog['classes']:
        if (not isinstance(section, dict) or not isinstance(section.get('id'), str)
                or not section['id'] or section['id'] in ids
                or not isinstance(section.get('name'), str) or not section['name'].strip()
                or not basename(section.get('manifest'), '.json')):
            raise ValueError('Each class needs a unique id, a name, and a JSON filename in classes/.')
        ids.add(section['id'])
        path = root / 'classes' / section['manifest']
        manifest = json.loads(path.read_text(encoding='utf-8'))
        for faction in ('f1', 'f2'):
            entries = manifest.get(faction)
            if not isinstance(entries, list):
                raise ValueError(f'{path.name} needs f1 and f2 strategy arrays.')
            seen = set()
            for entry in entries:
                if not isinstance(entry, dict) or not basename(entry.get('file'), '.py'):
                    raise ValueError(f'Invalid Python filename in {path.name} / {faction}.')
                filename = entry['file']
                if filename in seen:
                    raise ValueError(f'Duplicate strategy in {path.name}: {faction}/{filename}')
                seen.add(filename)
                strategy = root / faction / filename
                if not strategy.is_file() or strategy.is_symlink():
                    raise ValueError(f'Missing regular strategy file for {path.name}: {faction}/{filename}')
        if len(manifest['f1']) != len(manifest['f2']):
            raise ValueError(f'{path.name}: both factions must have the same number of strategies.')

def build(root):
    validate_classes(root)
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
