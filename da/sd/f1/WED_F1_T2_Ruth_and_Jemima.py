# Wednesday Tournament 2 | Faction 1 | Ruth & Jemima
# Register faction order: 4 | Photo: 1985.jpg
# Member: Jemima; ID: 2622673
# Member: Ruth; ID: 2622593
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
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
