def space_exploration_strategy(history, round_number, resource_multiplier):
    # First round: start by sharing
    if round_number == 1:
        return 'S'

    # Get the moves from the previous round
    my_previous_move, opponent_previous_move = history[-1]

    # Pavlov: Win-Stay, Lose-Shift
    if my_previous_move == opponent_previous_move:
        # Same moves: stay with the previous move
        return my_previous_move
    else:
        # Different moves: switch the previous move
        if my_previous_move == 'S':
            return 'K'
        else:
            return 'S'
