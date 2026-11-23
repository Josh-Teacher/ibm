# Monday Tournament 3 | Faction 1 | Chanda & Sishir

def space_exploration_strategy(history, round_number, resource_multiplier):
    if not history:
        return "S"

    shares = sum(move == "S" for _, move in history)
    if 2 * shares > len(history):
        return "S"
    return "K"
