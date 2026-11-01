# Monday Tournament 2 | Faction 2 | jobless
# Members: Radhe 2622706; Yukesh 2622405
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    opponent_moves = [opponent for mine, opponent in history]
    share_count = opponent_moves.count("S")
    keep_count = opponent_moves.count("K")
    if keep_count > share_count:
        return "K"
    return "S"
