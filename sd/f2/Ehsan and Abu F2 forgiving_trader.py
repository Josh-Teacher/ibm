import random


def space_exploration_strategy(history, round_number, resource_multiplier):
    # Round 1: start by sharing to build trust
    if round_number == 1:
        return 'S'

    # Last round (100): keep, because there is no future punishment
    if round_number >= 100:
        return 'K'

    # Look at the opponent's previous move
    opponent_last = history[-1][1]

    # If opponent shared, share back
    if opponent_last == 'S':
        decision = 'S'
    else:
        # If opponent kept, usually keep back,
        # but forgive 10% of the time to restart cooperation
        if random.random() < 0.10:
            decision = 'S'
        else:
            decision = 'K'

    return decision