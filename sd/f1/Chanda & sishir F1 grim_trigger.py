def space_exploration_strategy(history, round_number, resource_multiplier):
    # If the opponent has defected at least once, defect forever.
    if "K" in history:
        decision = "K"
    else:
        decision = "S"

    return decision
