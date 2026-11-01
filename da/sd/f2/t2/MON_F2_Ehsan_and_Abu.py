# Monday Tournament 2 | Faction 2 | Ehsan & Abu
# Members: Ehsan 2622823; Abu 2622384
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1:
        return "S"
    if resource_multiplier >= 1:
        return "S"
    return "K"
