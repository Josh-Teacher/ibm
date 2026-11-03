# Wednesday Tournament 2 | Faction 1 | Ali & Josh
# Ali: 2622219. Josh: no individual ID listed in the Wednesday register.
# Strategy: Counter Orbit
# Target: Butchers, Chains, Ruth & Jemima, Sarvar&Adham, and Furious.
# Maximize our total across five equally weighted 100-round target matches.
# Requires full history, constant RM from 0 to 2, and Share-only scoring.
# Share earns 3*RM against Share or RM against Keep. Keep earns 5 or 2.
# No opponent identity, file access, or current opponent move is used.

_ALL = 31
_COUNTS = tuple(bin(mask).count("1") for mask in range(32))
_rm = None
_values = {}


def _sharers(round_number, recent, sarvar_shared):
    # Bits: Butchers, Chains, Ruth & Jemima, Sarvar&Adham, Furious.
    # recent stores our last five actions, with Keep encoded as 1.
    result = 0
    if _rm >= 1 and round_number < 100:
        if round_number == 1 or (round_number % 2 == 0 and not recent & 1):
            result |= 1
        if round_number == 1 or not recent & 1:
            result |= 2
        if round_number <= 2 or (round_number % 3 != 0 and not recent & 1):
            result |= 4
    if round_number == 1:
        result |= 8
    elif round_number < 100:
        if _rm < 1:
            if round_number == 2 and not recent & 1:
                result |= 8
        elif not sarvar_shared and not recent & 1:
            result |= 8
    if _rm >= 1.5 and round_number < 100:
        if round_number <= 5 or _COUNTS[recent] <= 2:
            result |= 16
    return result


def _best(round_number, recent, sarvar_shared, possible):
    if round_number > 100 or not possible:
        return 0.0, "K"
    key = (round_number, recent, sarvar_shared, possible)
    if key in _values:
        return _values[key]
    predicted = _sharers(round_number, recent, sarvar_shared)
    sharing = possible & predicted
    keeping = possible ^ sharing
    share_count, keep_count = _COUNTS[sharing], _COUNTS[keeping]
    share_value = share_count * 3 * _rm + keep_count * _rm
    keep_value = share_count * 5 + keep_count * 2
    next_share = (recent << 1) & 31
    next_keep = next_share | 1
    next_sarvar = 1 if predicted & 8 else 0
    for subset in (sharing, keeping):
        if subset:
            share_value += _best(
                round_number + 1, next_share, next_sarvar, subset)[0]
            keep_value += _best(
                round_number + 1, next_keep, next_sarvar, subset)[0]
    answer = (share_value, "S") if share_value > keep_value else (keep_value, "K")
    _values[key] = answer
    return answer


def space_exploration_strategy(history, round_number, resource_multiplier):
    global _rm
    if not 1 <= round_number <= 100 or len(history) != round_number - 1:
        return "K"
    if not 0 <= resource_multiplier <= 2:
        return "K"
    if _rm != resource_multiplier:
        _rm = resource_multiplier
        _values.clear()
    possible = _ALL
    recent = sarvar_shared = 0
    for past_round, (mine, opponent) in enumerate(history, 1):
        predicted = _sharers(past_round, recent, sarvar_shared)
        possible &= predicted if opponent == "S" else _ALL ^ predicted
        if not possible:
            return "K"
        recent = ((recent << 1) | (mine == "K")) & 31
        sarvar_shared = 1 if predicted & 8 else 0
    return _best(round_number, recent, sarvar_shared, possible)[1]
