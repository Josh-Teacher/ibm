def space_exploration_strategy(history, round_number, resource_multiplier):
    """
    Butchers F1 - Balanced Trust strategy

    Returns:
        'S' to share
        'K' to keep
    """

    # Start cooperatively so mutual sharing is possible.
    if not history:
        return 'S'

    # Extract the opponent's previous moves.
    opponent_moves = [round_result[1] for round_result in history]

    # Count how often the opponent has shared.
    opponent_shares = opponent_moves.count('S')
    share_rate = opponent_shares / len(opponent_moves)

    # Look at the opponent's three most recent moves.
    recent_moves = opponent_moves[-3:]
    recent_keeps = recent_moves.count('K')

    # Repeated keeping is treated as exploitation.
    if len(recent_moves) >= 2 and recent_keeps >= 2:
        return 'K'

    # When resources are relatively scarce, require stronger evidence
    # that the opponent is cooperative before sharing.
    if resource_multiplier < 0.8:
        if share_rate >= 0.70:
            return 'S'
        return 'K'

    # Under normal or strong resource conditions, cooperate with an
    # opponent that has shared at least half of the time.
    if share_rate >= 0.50:
        return 'S'

    # Every fifth round offers a chance to restore cooperation.
    if round_number % 5 == 0:
        return 'S'

    # Otherwise protect resources.
    return 'K'
