def space_exploration_strategy(history, round_number, resource_multiplier):
    """
    Ledger Watch
    history: list of tuples, e.g. [('S','S'), ('K','S')]
             history[-1][0] = my last move, history[-1][1] = opponent's last move
    round_number: int, starts at 1
    resource_multiplier: float 0.5 to 1.5 (accepted but not used in the logic)
    Returns 'S' (cooperate) or 'K' (defect).
    """
    # Rule 1: Opening. Cooperate for the first 3 rounds to build trust.
    if round_number <= 3 or len(history) < 3:
        return 'S'

    mine = [h[0] for h in history]
    opp = [h[1] for h in history]
    n = len(opp)

    # Opponent's overall defection rate (the "ledger").
    defect_rate = opp.count('K') / n

    # Rule 2: Hardliner check. If the opponent defects 80%+ of the time, stop being exploited.
    if n >= 5 and defect_rate >= 0.8:
        return 'K'

    # Rule 3: Random check (after 10 rounds). Mixed behavior that does NOT mirror
    # my previous move looks random, so cooperating earns nothing. Defect.
    if n >= 10 and 0.3 <= defect_rate <= 0.7:
        mirror_matches = sum(1 for i in range(n - 1) if opp[i + 1] == mine[i])
        mirror_rate = mirror_matches / (n - 1)
        if mirror_rate < 0.75:
            return 'K'

    # Rule 4: Two strikes. Only retaliate if the opponent defected in each of the
    # last two rounds. A single defection is forgiven.
    if opp[-1] == 'K' and opp[-2] == 'K':
        return 'K'

    # Rule 5: Default is to cooperate.
    return 'S'
