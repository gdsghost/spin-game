package com.games.spin.api.dto;

import jakarta.validation.constraints.Min;

public record CreatePlayerRequest(@Min(0) long initialBalance) {}
