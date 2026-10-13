def space_exploration_strategy(history, round_number, resource_multiplier):
    # Round 1: start with SHARE to establish cooperation
    if round_number == 1:
        return 'S'

    # Get the opponent's previous moves
    opponent_moves = [opponent_move for my_move, opponent_move in history]

    # If our previous move was KEEP, evaluate the opponent's response
    if history and history[-1][0] == 'K':
        if history[-1][1] == 'S':
            # Opponent stayed cooperative after our test
            return 'S'
        else:
            # Opponent responded to our test with KEEP
            return 'K'

    # If the opponent repeatedly chooses KEEP, protect our resources
    if len(opponent_moves) >= 2 and opponent_moves[-1] == 'K' and opponent_moves[-2] == 'K':
        return 'K'

    # If the opponent has returned to SHARE, return to cooperation
    if opponent_moves and opponent_moves[-1] == 'S':
        # After 3 consecutive opponent SHARES, use KEEP as a controlled test
        if len(opponent_moves) >= 3 and all(
            move == 'S' for move in opponent_moves[-3:]
        ):
            return 'K'
        return 'S'

    # Default: cooperate
    return 'S'
