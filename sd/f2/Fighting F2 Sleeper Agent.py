def space_exploration_strategy(history, round_number, resource_multiplier):
    opponent_betrayed = any(opp_move == 'K' for my_move, opp_move in history)
    
    if opponent_betrayed and round_number < 85:
        return 'K'
        
    if round_number >= 85:
        return 'K'
        
    return 'S'