package com.games.spin.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "players")
public class Player {
    @Id
    private String id;

    @Column(nullable = false)
    private long balance;

    protected Player() {}

    public Player(long initialBalance) {
        this.id = UUID.randomUUID().toString();
        this.balance = initialBalance;
    }

    public String getId() { return id; }
    public long getBalance() { return balance; }

    public void credit(long amount) { this.balance += amount; }
    public void debit(long amount) { this.balance -= amount; }
}
