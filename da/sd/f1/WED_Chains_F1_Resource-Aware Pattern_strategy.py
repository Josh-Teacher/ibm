def space_exploration_strategy(history, round_number, resource_multiplier):
    # Start by sharing to encourage cooperation.
    if round_number <= 2:
        decision = 'S'

    # If there is no history yet, share.
    elif not history:
        decision = 'S'

    else:
        # Look at the opponent's most recent 4 moves.
        recent_moves = [opponent_move for my_move, opponent_move in history[-4:]]

        shares = recent_moves.count('S')
        keeps = recent_moves.count('K')

        # When resources are high, take a little more risk
        # and try to cooperate unless the opponent is clearly keeping.
        if resource_multiplier >= 1.2:
            if keeps >= 3:
                decision = 'K'
            else:
                decision = 'S'

        # When resources are low, be more careful about being exploited.
        elif resource_multiplier <= 0.8:
            if keeps >= 2:
                decision = 'K'
            else:
                decision = 'S'

        # For normal resources, respond to the overall recent pattern.
        else:
            if keeps == 4:
                decision = 'K'
            elif shares >= 3:
                decision = 'S'
            elif keeps >= 2:
                decision = 'K'
            else:
                decision = 'S'

        # If the opponent returns to sharing after a Keep,
        # return to cooperation instead of staying defensive.
        if history[-1][1] == 'S' and shares >= 2:
            decision = 'S'

    return decision
