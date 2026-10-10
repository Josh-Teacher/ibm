def space_exploration_strategy(history, round_number, resource_multiplier):

    # Cooperate on the first round.
    if round_number == 1:
        decision = "S"

    # Cooperate during the first three rounds.
    elif len(history) < 3:
        decision = "S"

    # Punish if the opponent defects three times in a row.
    elif history[-1] == "K" and history[-2] == "K" and history[-3] == "K":
        decision = "K"

    # If the opponent cooperates after a punishment,
    # return to cooperation.
    elif history[-1] == "S":
        decision = "S"

    # Otherwise, keep cooperating.
    else:
        decision = "S"

    return decision
