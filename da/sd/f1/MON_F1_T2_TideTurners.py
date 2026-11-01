# Monday Tournament 2 | Faction 1 | TideTurners
# Members: Kurbonali 2317556; Josh 174070
# Strategy: Countercurrent
# Target: the seven supplied Faction 1 opponents, one match each.
# Requires 100 fixed rounds, full history, and constant RM in 0.50-1.50.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Uses completed moves only; opponent identity is never supplied or read.
# Optimizes the combined point total for the seven equally weighted models.
# If an observation contradicts every model, falls back to Keep.

_ALL_MODELS = 127
_MODEL_COUNTS = tuple(bin(mask).count("1") for mask in range(128))
_LAST_THREE_KEEPS = (0, 1, 1, 2, 1, 2, 2, 3)
_cached_rm = None
_values = {}


def _predicted_sharers(round_number, recent, keeps):
    # Bits: GEN-Z, wij and saba, catalyst, Error404, SKY, Pagal,
    # and Chanda & Sishir. recent stores our last three moves (K = 1).
    result = 0
    if (round_number - 1) % 3 == 0:
        result |= 1
    if _cached_rm > 1 and round_number % 12 != 0:
        result |= 2
    if round_number <= 12 or (round_number <= 95 and not recent & 1):
        result |= 4
    if round_number == 1:
        if _cached_rm >= 1:
            result |= 8
    elif round_number < 100:
        window = 1 if round_number == 2 else 3
        bits = recent & window
        if (_cached_rm >= 1 and bits != window
                or _cached_rm < 1 and bits == 0):
            result |= 8
    if 11 <= round_number <= 50 and _LAST_THREE_KEEPS[recent] >= 2:
        result |= 16
    if round_number == 1 or (round_number < 100
                            and (not recent & 1 or keeps < 3)):
        result |= 32
    if round_number == 1 or (_cached_rm >= 1
                            and not recent & 1 and keeps > 0):
        result |= 64
    return result


def _best_remaining(round_number, recent, keeps, possible):
    if round_number > 100 or not possible:
        return 0.0, "K"
    key = (round_number, recent, keeps, possible)
    if key in _values:
        return _values[key]
    sharing = possible & _predicted_sharers(round_number, recent, keeps)
    keeping = possible ^ sharing
    share_count = _MODEL_COUNTS[sharing]
    keep_count = _MODEL_COUNTS[keeping]
    next_share = (recent << 1) & 7
    next_keep = next_share | 1
    # Sum our payoff across the remaining possible opponents.
    share_value = share_count * 3 * _cached_rm + keep_count * _cached_rm
    keep_value = share_count * 5 + keep_count * 2
    # Each completed opponent move identifies its corresponding subset.
    for subset in (sharing, keeping):
        if subset:
            share_value += _best_remaining(
                round_number + 1, next_share, keeps, subset)[0]
            keep_value += _best_remaining(
                round_number + 1, next_keep, min(3, keeps + 1), subset)[0]
    if share_value > keep_value:
        answer = (share_value, "S")
    else:
        answer = (keep_value, "K")
    _values[key] = answer
    return answer


def space_exploration_strategy(history, round_number, resource_multiplier):
    global _cached_rm
    if not 1 <= round_number <= 100 or len(history) != round_number - 1:
        return "K"
    if not 0.5 <= resource_multiplier <= 1.5:
        return "K"
    if _cached_rm != resource_multiplier:
        _cached_rm = resource_multiplier
        _values.clear()
    possible = _ALL_MODELS
    recent = keeps = 0
    for past_round, (mine, opponent) in enumerate(history, 1):
        predicted = _predicted_sharers(past_round, recent, keeps)
        if opponent == "S":
            possible &= predicted
        else:
            possible &= _ALL_MODELS ^ predicted
        if not possible:
            return "K"
        recent = ((recent << 1) | (mine == "K")) & 7
        keeps = min(3, keeps + (mine == "K"))
    return _best_remaining(round_number, recent, keeps, possible)[1]
