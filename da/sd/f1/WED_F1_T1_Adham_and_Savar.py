def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1 or len(history) == 0:
        return 'S'
    opponent_moves = [opponent for player, opponent in history]
    total_moves = len(opponent_moves)
    share_count = opponent_moves.count('S')
    keep_count = opponent_moves.count('K')
    cooperation_rate = share_count / total_moves
    recent_moves = opponent_moves[-3:]
    if cooperation_rate >= 0.60:
        return 'S'
    if len(recent_moves) >= 2:
        if recent_moves[-1] == 'K' and recent_moves[-2] == 'K':
            return 'K'
    if cooperation_rate < 0.40:
        return 'K'
    if resource_multiplier >= 1.25:
        return 'S'
    if share_count >= keep_count:
        return 'S'
    return 'K'

