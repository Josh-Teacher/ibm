
def space_exploration_strategy(history, round_number, resource_multiplier):

    # Start by sharing
    if not history:
        return "S"

    # Get the opponent's previous actions
    opponent_moves = [
        opponent_move for my_move, opponent_move in history
    ]

    # Examine the last three moves
    recent_moves = opponent_moves[-3:]

    # Count how many times the opponent kept
    keep_count = recent_moves.count("K")

    # Protect resources if the opponent keeps repeatedly
    if keep_count >= 2:
        decision = "K"
    else:
        decision = "S"

    return decision