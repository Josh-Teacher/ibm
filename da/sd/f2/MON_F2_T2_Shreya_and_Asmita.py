# Monday Tournament 2 | Faction 2 | Shreya & Asmita
# Members: Shreya 2622186; Asmiii 2622301
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    k_count = sum(opponent == "K" for mine, opponent in history)
    if resource_multiplier >= 1:
        if round_number == 10:
            return "S" if k_count <= 7 else "K"
        if round_number == 20:
            return "S" if k_count <= 15 else "K"
        return "S"
    if round_number == 10:
        return "K" if k_count >= 3 else "S"
    if round_number == 20:
        return "K" if k_count >= 5 else "S"
    return "K"
