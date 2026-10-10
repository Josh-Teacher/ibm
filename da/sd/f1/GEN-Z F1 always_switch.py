def space_exploration_strategy(history, round_number, resource_multiplier):
    # Choose S on the first round because there is no previous opponent move.
    if round_number == 1:
        return "S"

    # Look at the opponent's previous decision.
    opponent_last_move = history[-1]

    # If the opponent cooperated, defect.
    if opponent_last_move == "S":
        decision = "K"
    # If the opponent defected, cooperate.
    else:
        decision = "S"

    return decision
