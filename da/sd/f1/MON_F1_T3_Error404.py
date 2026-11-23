# Monday Tournament 3 | Faction 1 | Error 404

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number <= 2:
        return "S"

    if any(move == "S" for _, move in history[-2:]):
        return "S"
    return "K"
