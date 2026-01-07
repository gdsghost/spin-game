package com.games.spin.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SpinRequest(@NotBlank String playerId, @Min(1) long bet) {}