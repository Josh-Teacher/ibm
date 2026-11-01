# Monday Tournament 2 | Faction 2 | Diana &Haru
# Members: Diana 2622790
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    if round_number == 1:
        return "S"
    if resource_multiplier >= 1:
        return "S"
    keeps = sum(opponent == "K" for mine, opponent in history)
    if 5 * keeps >= 3 * len(history):
        return "K"
    mine, opponent = history[-1]
    return "S" if mine == opponent else "K"
