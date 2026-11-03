# Wednesday Tournament 2 | Faction 2 | Devon & Lahiru
# Register faction order: 2 | Photo: 1979.jpg
# Member: Devon; ID: 2622731
# Member: Lahiru; ID: 2622428
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number % 4 == 3 and resource_multiplier >= 1:
        return "S"
    return "K"
