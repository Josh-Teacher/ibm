# Monday Tournament 2 | Faction 1 | GEN-Z
# Members: Ratan 2622464; Aayush 2622765
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if (round_number - 1) % 3 == 0:
        return "S"
    return "K"
