# Monday Tournament 3 | Faction 2 | Fighting

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number <= 2:
        return "S"

    # Replay the checks to recover any permanent switch to Keep.
    opponent_keeps = 0
    for completed_round, (_, move) in enumerate(history, start=1):
        if move == "K":
            opponent_keeps += 1
        if completed_round >= 5 and 2 * opponent_keeps > completed_round:
            return "K"

    if all(move == "K" for _, move in history[-2:]):
        return "K"
    return "S"
