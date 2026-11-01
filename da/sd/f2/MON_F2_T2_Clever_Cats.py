# Monday Tournament 2 | Faction 2 | Clever Cats
# Members: Bikram 2622808; Ashish 2622071
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if any(opponent == "K" for mine, opponent in history):
        return "K"
    return "S"
