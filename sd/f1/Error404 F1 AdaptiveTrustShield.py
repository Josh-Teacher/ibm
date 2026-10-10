def space_exploration_strategy(history, round_number, resource_multiplier):

    if not history:
        return 'S'

    if round_number <= 10:
        recent_history = history[-3:]
    else:
        recent_history = history[-5:]

    share_threshold = 0.60 + (1.0 - resource_multiplier) * 0.10
    keep_threshold = 0.40 + (1.0 - resource_multiplier) * 0.05

    opponent_shares = sum(
        1 for my_move, opponent_move in recent_history
        if opponent_move == 'S'
    )

    sharing_rate = opponent_shares / len(recent_history)

    if sharing_rate >= share_threshold:
        return 'S'

    if sharing_rate < keep_threshold:
        return 'K'

    last_two = recent_history[-2:]

    recent_shares = sum(
        1 for my_move, opponent_move in last_two
        if opponent_move == 'S'
    )

    if recent_shares >= 1:
        return 'S'

    return 'K'
