# Wednesday Tournament 2 | Faction 2 | Pratima & Prashna
# Register faction order: 4 | Photo: Final attached image
# Member: Pratima; ID: 2622602
# Member: Prashna; ID: 2622278
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1 or round_number == 100:
        return "K"
    if resource_multiplier == 0.5 or resource_multiplier == 1.5:
        return "K"
    shares = sum(opponent == "S" for mine, opponent in history[-3:])
    return "S" if shares >= 2 else "K"
