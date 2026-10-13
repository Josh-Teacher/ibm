def space_exploration_strategy(history, round_number, resource_multiplier):
    # Determine the position in the 4-round repeating cycle
    cycle_position = round_number % 4
    
    # Rounds 1, 2, 5, 6... (remainder 1 or 2) return Share ('S')
    if cycle_position == 1 or cycle_position == 2:
        decision = 'S'
    # Rounds 3, 4, 7, 8... (remainder 3 or 0) return Keep ('K')
    else:
        decision = 'K'
        
    return decision