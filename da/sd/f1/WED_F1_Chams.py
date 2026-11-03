# Wednesday Tournament 2 | Faction 1 | Chams
# Source photo: 1983.jpg
# Member: Aashis [spelling uncertain]; ID: 2622510
# Member: Jibesh [spelling uncertain]; ID: 2622777
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
    return history[-1][1]
