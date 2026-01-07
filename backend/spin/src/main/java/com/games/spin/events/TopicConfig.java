package com.games.spin.events;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TopicConfig {
    @Bean
    public NewTopic spinEventsTopic() {
        return new NewTopic(KafkaTopics.SPIN_EVENTS, 1, (short) 1);
    }
}
