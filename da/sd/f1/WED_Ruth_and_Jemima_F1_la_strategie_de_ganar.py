def space_exploration_strategy(history, round_number, resource_multiplier):
    # First two rounds: Share
    if round_number <= 2:
        return 'S'

    # Defect every third round:
    # S, S, K, S, S, K, S, S, K...
    if (round_number - 3) % 3 == 0:
        return 'K'

    # Otherwise, Share
    return 'S'
