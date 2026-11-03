# Wednesday Tournament 2 | Faction 1 | SD Butchers
# Source photo: 1984.jpg
# Member: Bardan Tamang [spelling uncertain]; ID: 2622560
# Member: Dawali Jagit [spelling uncertain]; ID: 2622115
# Photo identity only; roster team name and order are unverified.
# Cleaned interpretation; see the report for added assumptions.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100 or resource_multiplier < 1:
        return "K"
    if round_number == 1:
        return "S"
    if round_number % 2 == 1:
        return "K"
    return history[-1][1]
