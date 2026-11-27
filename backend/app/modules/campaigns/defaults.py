"""Ad viewing rules shared by campaigns, verification and the dashboard player.

Kept in a leaf module (no model imports) so models, services and schemas can all use it.
"""

# The review unlocks after 29 s of real viewing and playback is cut at 30 s,
# so longer videos never demand more than 29 s.
AD_UNLOCK_SECONDS = 29.0
AD_MAX_SECONDS = 30
DEFAULT_DISPLAY_SECONDS = 30
DEFAULT_MIN_WATCH_PCT = 0.97  # 97% of a 30 s ad is 29.1 s, capped to AD_UNLOCK_SECONDS
