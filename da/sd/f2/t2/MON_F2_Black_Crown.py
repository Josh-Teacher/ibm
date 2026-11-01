# Monday Tournament 2 | Faction 2 | Black Crown
# Members: Rukhiya 2622437; Aliya 2622336
# Cleaned interpretation; see the report for assumptions.
# history contains (our_move, opponent_move) pairs.
# RM scales only a sharing player's own payoff; Keep is unscaled.
# Use full history and 100 fixed rounds.

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 100:
        return "K"
    if round_number == 1:
        return "S"
    state = "test"
    for completed_round, (mine, opponent) in enumerate(history, 1):
        if completed_round <= 2:
            continue
        if state == "test" and opponent == "K":
            state = "offer"
        elif state == "offer":
            state = "wait"
        elif state == "wait":
            state = "cooperate" if opponent == "S" else "protect"
        elif state == "cooperate" and opponent == "K":
            state = "protect"
    if state in ("offer", "wait", "cooperate"):
        return "S"
    return "K"
