# Wednesday Tournament 2 | Faction 2 | Khan &wisal
# Register faction order: 3 | Photo: 1980.jpg
# Member: Wisal; ID: 2622650
# Member: Khan; ID: 2622221
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1:
        return "S"
    return "K" if history[-1][1] == "S" else "S"
