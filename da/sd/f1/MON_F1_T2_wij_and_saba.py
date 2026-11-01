# Monday Tournament 2 | Faction 1 | wij and saba
# Members: Saba 2622359; Wijdan 2622662
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if resource_multiplier <= 1:
        return "K"
    if round_number % 12 == 0:
        return "K"
    return "S"
