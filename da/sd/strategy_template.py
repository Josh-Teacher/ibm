"""Copy this into f1/ or f2/ and give it your team's filename."""

def space_exploration_strategy(history, round_number, resource_multiplier):
    # history holds (my_previous_decision, opponent_previous_decision) tuples.
    # Return exactly "S" (Share) or "K" (Keep).
    if round_number % 3 == 0:
        return "K"
    return "S"
