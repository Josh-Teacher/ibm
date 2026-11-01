# Monday Tournament 2 | Faction 1 | Error404
# Members: Ajay 2622811; Yadav 2622207
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    if round_number == 1:
        return "S" if resource_multiplier >= 1 else "K"
    recent = [opponent for mine, opponent in history[-2:]]
    if resource_multiplier >= 1:
        return "S" if "S" in recent else "K"
    return "K" if "K" in recent else "S"
