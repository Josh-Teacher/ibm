def space_exploration_strategy(history, round_number, resource_multiplier):
    mode = 'test'
    recovery_rounds = 0
    recovery_limit = 3

    for our_move, their_move in history[1:]:
        if mode == 'test':
            if their_move == 'K':
                mode = 'recover'
                recovery_rounds = 0
        elif mode == 'recover':
            recovery_rounds += 1
            if our_move == 'S' and their_move == 'S':
                mode = 'cooperate'
            elif recovery_rounds >= recovery_limit:
                mode = 'defend'
        elif mode == 'cooperate':
            if their_move == 'K':
                mode = 'recover'
                recovery_rounds = 0

    if round_number == 1 or not history:
        decision = 'S'
    elif mode == 'test' or mode == 'defend':
        decision = 'K'
    else:
        decision = 'S'

    return decision
