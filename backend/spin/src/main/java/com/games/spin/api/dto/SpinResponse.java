package com.games.spin.api.dto;

public record SpinResponse(String playerId, long bet, long win, long newBalance) {}