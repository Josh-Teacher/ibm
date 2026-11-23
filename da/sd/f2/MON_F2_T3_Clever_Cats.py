# Monday Tournament 3 | Faction 2 | Clever Cats

def space_exploration_strategy(history, round_number, resource_multiplier):
    if not history:
        return "S"

    defending = False
    consecutive_shares = 0
    keeps_in_window = 0
    for index, (_, move) in enumerate(history):
        if move == "K":
            keeps_in_window += 1
            consecutive_shares = 0
        else:
            consecutive_shares += 1

        if index >= 5 and history[index - 5][1] == "K":
            keeps_in_window -= 1
        if consecutive_shares >= 3:
            defending = False
        elif index >= 4 and keeps_in_window >= 3:
            defending = True

    if defending:
        return "K"
    return history[-1][1]
