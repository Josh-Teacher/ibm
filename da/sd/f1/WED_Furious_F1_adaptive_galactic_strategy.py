def space_exploration_strategy(history, round_number, resource_multiplier):
    """
    Adaptive Galactic Strategy

    Assumption:
    - S means cooperate/share.
    - K means keep/take.
    - Each history item is a pair: (our_action, opponent_action).
    """

    # Start friendly if there are no previous rounds.
    if not history:
        return "S"

    # Read the opponent's actions from the history.
    opponent_actions = []
    for entry in history:
        if isinstance(entry, (list, tuple)) and len(entry) >= 2:
            opponent_action = entry[1]
            if opponent_action in ("S", "K"):
                opponent_actions.append(opponent_action)

    # If no usable opponent action is found, choose the safe default.
    if not opponent_actions:
        return "S"

    # Cooperate again as soon as the opponent becomes friendly.
    if opponent_actions[-1] == "S":
        return "S"

    # Defend yourself if the opponent has taken in two rounds in a row.
    if len(opponent_actions) >= 2 and opponent_actions[-2:] == ["K", "K"]:
        return "K"

    # Forgive a single taking action and remain friendly.
    return "S"
