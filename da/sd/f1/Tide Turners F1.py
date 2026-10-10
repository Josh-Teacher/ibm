def space_exploration_strategy(history, round_number, resource_multiplier):
    """
    Adaptive Reciprocal
    Actions: 'S' = Share, 'K' = Keep

    Designed for the provided Axelrod-style opponents.
    Assumes history contains (our_move, opponent_move) tuples.
    """

    # Cooperate initially to preserve trust-based and reciprocal matches.
    if not history or round_number <= 1:
        return 'S'

    # Final-round defection: no future round remains for retaliation.
    if round_number >= 99:
        return 'K'

    # Extract the opponent's moves and check whether we've ever kept.
    opponent_moves = [opponent_move for our_move, opponent_move in history]
    we_have_kept = any(our_move == 'K' for our_move, opponent_move in history)

    # A K from the opponent while we have only shared rules out the
    # supplied Sleeper Agent (before round 85). We can safely respond.
    opponent_defected_while_we_shared = any(
        our_move == 'S' and opponent_move == 'K'
        for our_move, opponent_move in history
    )

    # The Sleeper Agent defects from round 85 onward regardless.
    # Don't waste the endgame by continuing to share against it.
    if round_number >= 85 and opponent_moves and opponent_moves[-1] == 'K':
        return 'K'

    # Against an opponent that has defected while we shared, reciprocate
    # its latest action: retaliate against K, resume cooperation after S.
    if opponent_defected_while_we_shared:
        return 'K' if opponent_moves[-1] == 'K' else 'S'

    # If we have not seen an early opponent K, avoid being the first to
    # defect: doing so would trigger the supplied Sleeper Agent.
    return 'S'
