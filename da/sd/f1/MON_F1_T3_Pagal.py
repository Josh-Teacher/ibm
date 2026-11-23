# Monday Tournament 3 | Faction 1 | Pagal

def space_exploration_strategy(history, round_number, resource_multiplier):
    # The most recent run of three identical moves sets the mode.
    for end in range(len(history) - 1, 1, -1):
        move = history[end][1]
        if move == history[end - 1][1] == history[end - 2][1]:
            return move
    return "S"
