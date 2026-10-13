def space_exploration_strategy(history, round_number, resource_multiplier):
    # Prober strategy:
    # S = cooperate, K = defect.

    # First round: cooperate to establish a friendly starting point.
    if round_number == 1:
        decision = "S"

    # Second round: deliberately defect to test the opponent.
    elif round_number == 2:
        decision = "K"

    # Third round: cooperate again and observe the opponent's response.
    elif round_number == 3:
        decision = "S"

    # After the test, use the opponent's latest move.
    else:
        # If the opponent defected in the previous round,
        # respond with defection.
        if history and history[-1] == "K":
            decision = "K"
        else:
            # Otherwise, continue cooperating.
            decision = "S"

    # The strategy must always return either S or K.
    return decision
