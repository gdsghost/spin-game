package com.games.spin.events;

import java.time.Instant;

public record SpinCompletedEvent(
        String eventType,
        String playerId,
        long bet,
        long win,
        long newBalance,
        Instant timestamp
) {}