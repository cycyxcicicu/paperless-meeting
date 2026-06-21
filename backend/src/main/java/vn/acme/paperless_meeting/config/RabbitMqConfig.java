package vn.acme.paperless_meeting.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {
    public static final String INVITATION_QUEUE = "meeting.invitation.queue";
    public static final String MEETING_EXCHANGE = "meeting.exchange";
    public static final String INVITATION_ROUTING_KEY = "meeting.invitation.routing";

    @Bean
    public Queue invitationQueue() {
        return new Queue(INVITATION_QUEUE, true); // durable = true
    }

    @Bean
    public TopicExchange meetingExchange() {
        return new TopicExchange(MEETING_EXCHANGE);
    }

    @Bean
    public Binding bindingInvitationQueue(Queue invitationQueue, TopicExchange meetingExchange) {
        return BindingBuilder.bind(invitationQueue).to(meetingExchange).with(INVITATION_ROUTING_KEY);
    }
}
