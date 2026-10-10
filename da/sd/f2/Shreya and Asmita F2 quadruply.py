def space_exploration_strategy(history, round_number, resource_multiplier):
    # Share for the first four games.
    if round_number <= 4:
        return "S"

    # Look at the opponent's choices in the previous four games.
    previous_four = history[-4:]

    # Count how many of those four choices were Defect (K).
    defect_count = previous_four.count("K")

    # Count how many of those four choices were Share (S).
    share_count = previous_four.count("S")

    # If the opponent defected more than twice, defect.
    if defect_count > 2:
        return "K"

    # If the opponent shared more than twice, cooperate/share.
    if share_count > 2:
        return "S"

    # If the previous four games are tied (2 S and 2 K), defect.
    return "K"
