# Wednesday Tournament 2 | Faction 1 | Shusi and Ahomud
# Source photo: 1986.jpg
# Member: Shusi [spelling uncertain]; ID: 2622313
# Member: Ahomud [spelling uncertain]; ID: 2622717
# Photo identity only; roster team name and order are unverified.
# Cleaned interpretation; see the report for added assumptions.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100 or resource_multiplier < 1.5:
        return "K"
    if round_number <= 5:
        return "S"
    shares = sum(opponent == "S" for mine, opponent in history[-5:])
    return "S" if shares >= 3 else "K"
