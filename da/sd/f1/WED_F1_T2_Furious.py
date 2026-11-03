# Wednesday Tournament 2 | Faction 1 | Furious
# Register faction order: 6 | Photo: 1986.jpg
# Member: Shusil; ID: 2622313
# Member: Ahmad; ID: 2622717
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100 or resource_multiplier < 1.5:
        return "K"
    if round_number <= 5:
        return "S"
    shares = sum(opponent == "S" for mine, opponent in history[-5:])
    return "S" if shares >= 3 else "K"
