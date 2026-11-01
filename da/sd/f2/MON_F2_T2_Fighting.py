# Monday Tournament 2 | Faction 2 | Fighting
# Members: Kaveesha 2622578; Manuthi 2622280
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    if round_number == 1:
        return "S"
    if any(mine == "S" and opponent == "K"
           for mine, opponent in history):
        return "K"
    share_block = (1 <= round_number <= 45
                   or 76 <= round_number <= 85)
    if share_block and resource_multiplier >= 1:
        return "S"
    return "K"
