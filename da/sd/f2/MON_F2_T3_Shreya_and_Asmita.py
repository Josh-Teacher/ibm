# Monday Tournament 3 | Faction 2 | Shreya & Asmita

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number <= 3:
        return "S"

    shares = sum(move == "S" for _, move in history)
    keeps = len(history) - shares
    if shares > 3 and shares > keeps:
        return "S"
    return "K"
