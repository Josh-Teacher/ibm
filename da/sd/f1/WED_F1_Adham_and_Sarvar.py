# Wednesday Tournament 2 | Faction 1 | Adham and Sarvar
# Source photo: 1988.jpg
# Member: Adham; ID: 2622083
# Member: Sarvar; ID: 2622395
# Photo identity only; roster team name and order are unverified.
# Cleaned interpretation; see the report for added assumptions.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    if round_number == 1:
        return "S"
    if resource_multiplier < 1:
        if round_number == 2 and history[-1][1] == "S":
            return "S"
        return "K"
    mine, opponent = history[-1]
    if mine == "K" and opponent == "S":
        return "S"
    return "K"
