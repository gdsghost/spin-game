package com.games.spin.service;

import com.games.spin.domain.Player;
import com.games.spin.events.KafkaTopics;
import com.games.spin.events.SpinCompletedEvent;
import com.games.spin.repo.PlayerRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.transaction.Transactional;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;

@Service
public class GameService {
    private final PlayerRepository playerRepository;
    private final KafkaTemplate<String, SpinCompletedEvent> kafkaTemplate;
    private final SecureRandom rng = new SecureRandom();

    // Metrics
    private final Counter spinsTotal;
    private final Counter spinsWonTotal;

    public GameService(PlayerRepository playerRepository, KafkaTemplate<String, SpinCompletedEvent> kafkaTemplate,
                       MeterRegistry meterRegistry) {
        this.playerRepository = playerRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.spinsTotal = meterRegistry.counter("game.spins.total");
        this.spinsWonTotal = meterRegistry.counter("game.spins.won.total");
    }

    @Transactional
    public SpinResult spin(String playerId, long bet) {
        Player p = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        if (bet <= 0) throw new IllegalArgumentException("Bet must be > 0");
        if (p.getBalance() < bet) throw new IllegalArgumentException("Insufficient balance");

        // Debit bet
        p.debit(bet);
        spinsTotal.increment();

        // Simple win logic: 30% chance to win 2x bet, else 0.
        boolean win = rng.nextInt(100) < 30;
        long winAmount = win ? bet * 2 : 0;

        if (winAmount > 0) {
            p.credit(winAmount);
            spinsWonTotal.increment();
        }

        playerRepository.save(p);

        // Publish event
        SpinCompletedEvent event = new SpinCompletedEvent(
                "SPIN_COMPLETED",
                playerId,
                bet,
                winAmount,
                p.getBalance(),
                Instant.now()
        );

        kafkaTemplate.send(KafkaTopics.SPIN_EVENTS, playerId, event);

        return new SpinResult(bet, winAmount, p.getBalance());
    }

    public record SpinResult(long bet, long win, long newBalance) {}
}