"""
Space Dilemma Strategy
Team: Ali
Strategy name: Adaptive Reciprocity

Required function:
    space_exploration_strategy(history, round_number, resource_multiplier)

Returns exactly "S" (Share) or "K" (Keep).
"""

def space_exploration_strategy(history, round_number, resource_multiplier):
    # Round 1: start by sharing to test whether the opponent is cooperative.
    if round_number == 1 or not history:
        return "S"

    # Count the opponent's previous behavior.
    opponent_shares = sum(1 for my_move, opp_move in history if opp_move == "S")
    opponent_keeps = sum(1 for my_move, opp_move in history if opp_move == "K")

    total = opponent_shares + opponent_keeps

    # Early rounds: give cooperation a chance unless the opponent has
    # already shown a strong tendency to keep.
    if total <= 3:
        if opponent_keeps >= 3:
            return "K"
        return "S"

    share_rate = opponent_shares / total

    # Recent behavior is more important than very old behavior.
    recent = history[-5:]
    recent_keeps = sum(1 for my_move, opp_move in recent if opp_move == "K")
    recent_share_rate = (len(recent) - recent_keeps) / len(recent)

    # If the opponent is strongly cooperative, share.
    if share_rate >= 0.70 and recent_share_rate >= 0.60:
        return "S"

    # If the opponent is strongly exploitative, keep.
    if share_rate <= 0.30 or recent_share_rate <= 0.20:
        return "K"

    # Mixed behavior: respond to the latest move, but do not copy TFT exactly.
    # Cooperation after a recent share is preferred when the opponent has
    # a generally cooperative record.
    last_opponent_move = history[-1][1]

    if last_opponent_move == "S" and share_rate >= 0.50:
        return "S"

    if last_opponent_move == "K":
        # Forgive an occasional K when overall cooperation remains high.
        if share_rate >= 0.65:
            return "S"
        return "K"

    # Resource multiplier adjustment.
    # Lower resources make mutual sharing more attractive; higher resources
    # allow slightly more cautious behavior.
    if resource_multiplier < 0.80 and share_rate >= 0.45:
        return "S"

    return "K"
