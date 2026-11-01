# Monday Tournament 2 | Faction 1 | SKY
# Members: Sakuni 2622127; Udari 2622324
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number <= 10 or round_number >= 51:
        return "K"
    shares = sum(opponent == "S" for mine, opponent in history[-3:])
    return "K" if shares >= 2 else "S"
