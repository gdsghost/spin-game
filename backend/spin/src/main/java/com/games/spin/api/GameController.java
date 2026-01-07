package com.games.spin.api;

import com.games.spin.api.dto.CreatePlayerRequest;
import com.games.spin.api.dto.CreatePlayerResponse;
import com.games.spin.api.dto.SpinRequest;
import com.games.spin.api.dto.SpinResponse;
import com.games.spin.domain.Player;
import com.games.spin.repo.PlayerRepository;
import com.games.spin.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api")
public class GameController {
    private final PlayerRepository playerRepository;
    private final GameService gameService;

    public GameController(PlayerRepository playerRepository, GameService gameService) {
        this.playerRepository = playerRepository;
        this.gameService = gameService;
    }

    @PostMapping("/player")
    public ResponseEntity<CreatePlayerResponse> createPlayer(@Valid @RequestBody CreatePlayerRequest req) {
        Player p = new Player(req.initialBalance());
        playerRepository.save(p);
        return ResponseEntity.ok(new CreatePlayerResponse(p.getId(), p.getBalance()));
    }

    @GetMapping("/balance/{playerId}")
    public ResponseEntity<?> balance(@PathVariable String playerId) {
        Player p = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        return ResponseEntity.ok(new CreatePlayerResponse(p.getId(), p.getBalance()));
    }

    @PostMapping("/spin")
    public ResponseEntity<SpinResponse> spin(@Valid @RequestBody SpinRequest req) {
        var result = gameService.spin(req.playerId(), req.bet());
        return ResponseEntity.ok(new SpinResponse(req.playerId(), result.bet(), result.win(), result.newBalance()));
    }
}