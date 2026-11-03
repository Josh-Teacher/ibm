# Strategy: Adaptive Forgiver
# Team Catalyst (Faction 1) - Amisha Lama (2622163), Priyanshi Pandeya (2622614)


def space_exploration_strategy(history, round_number, resource_multiplier):
    # Rule 1: Start friendly. Share on the first round.
    if round_number == 1 or len(history) == 0:
        return 'S'

    # Rule 2: Endgame. In the last round (100) there is no future to protect,
    # so keeping is the best choice.
    if round_number >= 100:
        return 'K'

    opp_moves = [h[1] for h in history]
    my_moves = [h[0] for h in history]

    # Rule 3: Detect a random opponent after 20 rounds of data.
    # A random player shares about half the time and does NOT copy our moves.
    # Against that kind of player, always keeping scores more.
    if len(history) >= 20:
        share_rate = opp_moves.count('S') / len(opp_moves)
        echoes = 0
        for i in range(1, len(history)):
            if opp_moves[i] == my_moves[i - 1]:
                echoes += 1
        echo_rate = echoes / (len(history) - 1)
        if 0.3 <= share_rate <= 0.7 and echo_rate < 0.75:
            return 'K'

    # Rule 4: Forgiving reciprocity.
    # Punish only if the opponent kept in BOTH of the last two rounds.
    # A single keep is forgiven, which avoids endless revenge loops.
    if len(history) >= 2 and opp_moves[-1] == 'K' and opp_moves[-2] == 'K':
        return 'K'

    # Rule 5: Otherwise share.
    return 'S'
