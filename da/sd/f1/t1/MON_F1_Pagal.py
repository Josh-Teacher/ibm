# Monday Tournament 2 | Faction 1 | Pagal
# Members: Binod 2622104; Teklal 2622066
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    if round_number == 1:
        return "S"
    opponent_moves = [opponent for mine, opponent in history]
    if opponent_moves[-1] == "S":
        return "S"
    if opponent_moves.count("K") >= 3:
        return "K"
    return "S"
