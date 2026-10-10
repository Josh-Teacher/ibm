def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1:
        return "K"
    elif round_number <= 95:
        opponent_previous_move = history[-1][1]
        return opponent_previous_move
    else:
        return "K"
