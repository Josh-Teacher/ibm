# Wednesday Tournament 2 | Faction 1 | Chains
# Register faction order: 3 | Photo: 1983.jpg
# Member: Aashis; ID: 2622510
# Member: Jibesh; ID: 2622777
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100 or resource_multiplier < 1:
        return "K"
    if round_number == 1:
        return "S"
    return history[-1][1]
