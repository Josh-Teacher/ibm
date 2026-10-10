def space_exploration_strategy(history, round_number, resource_multiplier):
    """
    PAVLOV-TRUST
    Win-Stay, Lose-Shift strategy with trust and resource adjustments.
    Returns only 'S' (Share) or 'K' (Keep).
    """

    if not history or round_number == 1:
        return 'S'

    if round_number == 2:
        return 'S'

    if round_number == 3:
        return 'K'

    my_last = history[-1][0]
    opponent_last = history[-1][1]

    if my_last == 'S' and opponent_last == 'S':
        last_payoff = 3
    elif my_last == 'S' and opponent_last == 'K':
        last_payoff = 1
    elif my_last == 'K' and opponent_last == 'S':
        last_payoff = 5
    else:
        last_payoff = 2

    betrayals = sum(
        1 for my_move, opponent_move in history
        if my_move == 'S' and opponent_move == 'K'
    )

    opponent_shares = sum(
        1 for my_move, opponent_move in history
        if opponent_move == 'S'
    )
    opponent_share_rate = opponent_shares / len(history)

    # Pavlov: win -> stay; lose -> switch.
    if last_payoff in (3, 5):
        decision = my_last
    else:
        decision = 'K' if my_last == 'S' else 'S'

    if betrayals >= 4 and opponent_share_rate < 0.5:
        decision = 'K'
    elif opponent_share_rate > 0.75 and resource_multiplier >= 1.0:
        decision = 'S'
    elif resource_multiplier < 0.8:
        decision = 'K'

    return decision
