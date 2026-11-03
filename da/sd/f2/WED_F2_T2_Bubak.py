# Wednesday Tournament 2 | Faction 2 | Bubak
# Register faction order: 6 | Photo: 1981.jpg
# Member: Saqib; ID: 2622244
# Member: Zubair; ID: 2622140
# Names, IDs, faction, and team follow Student Data (Wednesday).xlsx.
# Cleaned interpretation; see the report for added rules.
# history contains completed (our_move, opponent_move) pairs.
# Use 100 fixed rounds and full history.
# RM scales only a sharing player's own payoff; Keep is unscaled.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    if round_number <= 3:
        return "S"
    opponent_moves = [opponent for mine, opponent in history]
    if round_number >= 99 and "K" in opponent_moves:
        return "K"
    if round_number <= 10:
        return "S" if resource_multiplier >= 1 else "K"
    copies = all(history[i][1] == history[i - 1][0]
                 for i in range(1, len(history)))
    keeps = opponent_moves.count("K")
    if (resource_multiplier < 1 and copies
            and 10 * keeps >= 3 * len(history)):
        return "K"
    return "S"
