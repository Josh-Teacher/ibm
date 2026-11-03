def space_exploration_strategy(history, round_number, resource_multiplier):
    # Start by sharing to build trust.
    if len(history) == 0:
        return 'S'

    # Look at the opponent's last 5 moves.
    recent_history = history[-5:]

    opponent_keeps = 0
    opponent_shares = 0

    for my_move, opponent_move in recent_history:
        if opponent_move == 'K':
            opponent_keeps += 1
        else:
            opponent_shares += 1

    # Calculate the opponent's recent Keep rate.
    total_moves = opponent_keeps + opponent_shares
    keep_rate = opponent_keeps / total_moves

    # High Keep rate means lower trust.
    trust = 1 - keep_rate

    # High resources encourage cooperation.
    if resource_multiplier > 1.2:
        trust += 0.10

    # Low resources make the strategy more defensive.
    elif resource_multiplier < 0.8:
        trust -= 0.10

    # Be slightly more cautious near the end.
    if round_number >= 15:
        trust -= 0.10

    # Keep trust between 0 and 1.
    trust = max(0, min(1, trust))

    # Choose the action based on trust.
    if trust >= 0.60:
        decision = 'S'
    else:
        decision = 'K'

    return decision
