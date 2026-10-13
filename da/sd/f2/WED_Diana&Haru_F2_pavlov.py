def space_exploration_strategy(history, round_number, resource_multiplier):
    # First round: start by sharing
    if round_number == 1:
        return 'S'

    # Get the previous round's moves
    my_previous_move, opponent_previous_move = history[-1]

    # Pavlov: Win-Stay, Lose-Shift
    if my_previous_move == opponent_previous_move:
        decision = my_previous_move
    elif my_previous_move == 'S':
        decision = 'K'
    else:
        decision = 'S'

    # The function must return either 'S' or 'K'
    return decision
