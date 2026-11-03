# Wednesday Tournament 2 | Faction 1 | Ruth and Jemima
# Source photo: 1985.jpg
# Member: Ruth Hernandez; ID: 2622593
# Member: Jemima Guina; ID: 2622673
# Photo identity only; roster team name and order are unverified.
# Cleaned interpretation; see the report for added assumptions.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100 or resource_multiplier < 1:
        return "K"
    if round_number <= 2:
        return "S"
    if round_number % 3 == 0:
        return "K"
    return history[-1][1]
