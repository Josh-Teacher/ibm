# Wednesday Tournament 2 | Faction 2 | Rakib & Zia
# Register faction order: 5 | Photo: 1982.jpg
# Member: Zia; ID: 2622648
# Member: Rakib; ID: 2622581
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1:
        return "S"
    if resource_multiplier < 1:
        return "K"
    recent = [opponent for mine, opponent in history[-2:]]
    if len(recent) == 2 and all(move == "K" for move in recent):
        return "K"
    if round_number == 6:
        return "K"
    return "S"
