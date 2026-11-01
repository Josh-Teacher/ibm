# Monday Tournament 2 | Faction 1 | Chanda & Sishir
# Members: Chanda 2622372; Sishir 2622267
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1:
        return "S"
    opponent_moves = [opponent for mine, opponent in history]
    if opponent_moves[-1] == "K":
        return "K"
    if all(move == "S" for move in opponent_moves):
        return "K"
    if resource_multiplier >= 1:
        return "S"
    return "K"
