# Monday Tournament 2 | Faction 1 | catalyst
# Members: Priyanshi 2622614; Amisha 2622163
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number >= 96:
        return "K"
    if round_number <= 12:
        return "S"
    return history[-1][1]
