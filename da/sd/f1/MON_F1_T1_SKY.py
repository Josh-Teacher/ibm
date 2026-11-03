def space_exploration_strategy(history, round_number, resource_multiplier):

    # Round 100: always Share
    if round_number == 100:
        decision = "S"

    # First three rounds: Keep
    elif round_number <= 3:
        decision = "K"

    # From round 4: check the opponent's last three moves
    else:
        last_three_moves = history[-3:]

        opponent_shares = 0

        for my_move, opponent_move in last_three_moves:
            if opponent_move == "S":
                opponent_shares += 1

        if opponent_shares >= 2:
            decision = "S"
        else:
            decision = "K"

    return decision
