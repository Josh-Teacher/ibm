"""Browser-owned Python adapter. Defensive validation, not a security sandbox."""
import ast
import builtins
import inspect
import json
import math
import random
import traceback

ALLOWED = {'random': random, 'math': math}

def restricted_import(name, globals=None, locals=None, fromlist=(), level=0):
    if level or name not in ALLOWED:
        raise ImportError('Only random and math imports are supported')
    return ALLOWED[name]

def prepare(source, filename, seed):
    tree = ast.parse(source, filename=filename)
    blocked = {'eval', 'exec', 'compile', 'open', 'input', 'globals', 'locals', 'vars', 'getattr', 'setattr', 'delattr', '__import__', 'breakpoint', 'help'}
    for node in ast.walk(tree):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            names = [a.name for a in node.names] if isinstance(node, ast.Import) else [node.module]
            if getattr(node, 'level', 0) or any(n not in ALLOWED for n in names):
                raise SyntaxError('Only random and math imports are supported', (filename, node.lineno, node.col_offset+1, source.splitlines()[node.lineno-1]))
        if (isinstance(node, ast.Attribute) and node.attr.startswith('__')) or (isinstance(node, ast.Name) and (node.id in blocked or node.id.startswith('__'))):
            raise SyntaxError('Unsupported introspection or built-in', (filename, node.lineno, node.col_offset+1, source.splitlines()[node.lineno-1]))
    safe = {k:v for k,v in vars(builtins).items() if k not in blocked and not k.startswith('__')}
    safe['__import__'] = restricted_import
    safe['print'] = lambda *args, **kwargs: None
    namespace = {'__builtins__':safe, '__name__':'strategy'}
    random.seed(seed)
    exec(compile(tree, filename, 'exec'), namespace)
    fn = namespace.get('space_exploration_strategy')
    if not callable(fn):
        raise TypeError('Missing callable space_exploration_strategy(history, round_number, resource_multiplier)')
    inspect.signature(fn).bind([], 1, 1.0)
    if inspect.iscoroutinefunction(fn) or inspect.isgeneratorfunction(fn):
        raise TypeError('Strategy must be synchronous and return S or K')
    return fn

_fn = None
_history = []
_filename = ''
_multiplier = 1.0
_limit = 0

def handle(request_json):
    global _fn, _history, _filename, _multiplier, _limit
    request = json.loads(request_json)
    try:
        if request['type'] == 'init':
            _filename = request['filename']
            _history = []
            _multiplier = float(request['multiplier'])
            _limit = int(request['historyLimit'])
            _fn = prepare(request['source'], _filename, request['seed'])
            value = 'validated'
        else:
            if request.get('previous') is not None:
                _history.append(tuple(request['previous']))
                if _limit and len(_history) > _limit:
                    del _history[:-_limit]
            value = _fn(list(_history), request['round'], _multiplier)
            if type(value) is not str or value not in ('S', 'K'):
                raise ValueError('Return exactly "S" or "K" (received '+repr(value)[:120]+')')
        return json.dumps({'value':value})
    except BaseException as error:
        line = getattr(error, 'lineno', None)
        for frame in traceback.extract_tb(error.__traceback__):
            if frame.filename == _filename:
                line = frame.lineno
        return json.dumps({'error':f'{_filename}'+(f':{line}' if line else '')+f' · round {request.get("round", 0)} · {type(error).__name__}: {str(error)[:500]}'})
