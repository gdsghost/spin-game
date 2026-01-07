package com.games.spin.events;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class SpinEventsConsumer {
    private static final Logger log = LoggerFactory.getLogger(SpinEventsConsumer.class);

    @KafkaListener(topics = KafkaTopics.SPIN_EVENTS)
    public void onSpinCompleted(SpinCompletedEvent event) {
        log.info("EVENT_RECEIVED type={} playerId={} bet={} win={} newBalance={} ts={}",
                event.eventType(),
                event.playerId(),
                event.bet(),
                event.win(),
                event.newBalance(),
                event.timestamp()
        );
    }
}