#!/usr/bin/env python3
"""Validate class -> strategies manifests without rewriting instructor-authored groups."""
import argparse
import json
from pathlib import Path

def validate_entries(root, faction, entries, label):
    if not isinstance(entries, list):
        raise ValueError(f'{label} needs a strategies array.')
    seen = set()
    for entry in entries:
        filename = entry.get('file') if isinstance(entry, dict) else None
        if (not isinstance(filename, str) or len(filename) <= 3 or not filename.endswith('.py')
                or '/' in filename or '\\' in filename or any(ord(c) < 32 for c in filename)):
            raise ValueError(f'Invalid Python filename in {label}.')
        if filename in seen:
            raise ValueError(f'Duplicate strategy in {label}: {filename}')
        seen.add(filename)
        path = root / faction / filename
        if not path.is_file() or path.is_symlink():
            raise ValueError(f'Missing regular strategy file: {faction}/{filename}')

def build(root):
    manifests, counts = {}, {}
    for faction in ('f1', 'f2'):
        folder = root / faction
        folder.mkdir(parents=True, exist_ok=True)
        target = folder / 'manifest.json'
        manifests[faction] = json.loads(target.read_text(encoding='utf-8')) if target.exists() else {'classes': {}}
        counts[faction] = sum(p.name != '__init__.py' for p in folder.glob('*.py'))
    grouped = ['classes' in manifests[f] for f in ('f1','f2')]
    if any(grouped) and not all(grouped):
        raise ValueError('Both faction manifests must use the same class structure.')
    if all(grouped):
        for faction, manifest in manifests.items():
            classes = manifest['classes']
            if not isinstance(classes, dict):
                raise ValueError(f'{faction}/manifest.json needs a classes object.')
            for class_id, section in classes.items():
                if (not class_id or class_id in ('all','demo') or not isinstance(section, dict)
                        or not isinstance(section.get('name'), str) or not section['name'].strip()):
                    raise ValueError(f'Invalid class identifier or name in {faction}/manifest.json.')
                validate_entries(root, faction, section.get('strategies'), f'{faction}/manifest.json / {class_id}')
        left, right = manifests['f2']['classes'], manifests['f1']['classes']
        if left.keys() != right.keys():
            raise ValueError('Both faction manifests must list the same class identifiers.')
        for class_id in left:
            if left[class_id]['name'] != right[class_id]['name']:
                raise ValueError(f'Class names must match: {class_id}')
            if len(left[class_id]['strategies']) != len(right[class_id]['strategies']):
                raise ValueError(f'{class_id}: both factions must have the same number of strategies.')
        for faction in ('f1','f2'):
            target = root / faction / 'manifest.json'
            if not target.exists():
                target.write_text(json.dumps(manifests[faction], indent=2)+'\n', encoding='utf-8')
    else:
        # Backward compatibility with old, single-class manifests.
        for faction in ('f1','f2'):
            names = {s['file']: s.get('name') for s in manifests[faction].get('strategies', [])}
            entries = []
            for path in sorted((root/faction).glob('*.py'), key=lambda p:p.name.casefold()):
                if path.name == '__init__.py':
                    continue
                if path.is_symlink():
                    raise ValueError(f'Strategy must be a regular file: {path}')
                entries.append({'file':path.name,'name':names.get(path.name) or path.stem.replace('_',' ')})
            (root/faction/'manifest.json').write_text(json.dumps({'strategies':entries},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return counts

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    root = parser.parse_args().root.resolve()
    counts = build(root)
    print(f"Validated manifests; found {counts['f1']} Python files in f1/ and {counts['f2']} in f2/.")
    for faction in ('f1','f2'):
        manifest = json.loads((root/faction/'manifest.json').read_text(encoding='utf-8'))
        if 'classes' in manifest:
            assigned = {s['file'] for c in manifest['classes'].values() for s in c['strategies']}
            unassigned = sorted(p.name for p in (root/faction).glob('*.py') if p.name != '__init__.py' and p.name not in assigned)
            if unassigned:
                print(f"Not assigned to a class in {faction}/manifest.json: {', '.join(unassigned)}")
