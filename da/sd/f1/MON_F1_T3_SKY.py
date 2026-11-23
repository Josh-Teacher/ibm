# Monday Tournament 3 | Faction 1 | SKY

def space_exploration_strategy(history, round_number, resource_multiplier):
    if round_number == 1:
        return "K"

    if round_number <= 5:
        shares = sum(move == "S" for _, move in history)
        return "S" if 2 * shares > len(history) else "K"

    if round_number <= 195:
        shares = sum(move == "S" for _, move in history[-5:])
        return "S" if resource_multiplier >= 1.3 and shares >= 4 else "K"

    if round_number <= 200:
        return "K" if all(move == "K" for _, move in history[-3:]) else "S"

    return "K"
