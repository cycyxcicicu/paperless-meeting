package vn.acme.paperless_meeting.config.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import vn.acme.paperless_meeting.service.auth.JwtTokenVerifier;
import vn.acme.paperless_meeting.service.auth.SecurityUserDetailsService;

import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenVerifier jwtTokenVerifier;
    private final SecurityUserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        HttpSessionHandshakeInterceptor cookieInterceptor = new HttpSessionHandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(org.springframework.http.server.ServerHttpRequest request,
                                           org.springframework.http.server.ServerHttpResponse response,
                                           org.springframework.web.socket.WebSocketHandler wsHandler,
                                           Map<String, Object> attributes) throws Exception {
                if (request instanceof org.springframework.http.server.ServletServerHttpRequest) {
                    jakarta.servlet.http.HttpServletRequest servletRequest =
                            ((org.springframework.http.server.ServletServerHttpRequest) request).getServletRequest();
                    jakarta.servlet.http.Cookie[] cookies = servletRequest.getCookies();
                    if (cookies != null) {
                        for (jakarta.servlet.http.Cookie cookie : cookies) {
                            if ("ACCESS_TOKEN".equals(cookie.getName())) {
                                attributes.put("token", cookie.getValue());
                                log.info("Extracted ACCESS_TOKEN from cookie during WebSocket handshake");
                                break;
                            }
                        }
                    }
                }
                return super.beforeHandshake(request, response, wsHandler, attributes);
            }
        };

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(cookieInterceptor)
                .withSockJS();
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(cookieInterceptor);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String token = null;

                    // 1. Try native headers (Authorization)
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        token = authHeader.substring(7).trim();
                    }

                    // 2. Try session attributes populated during handshake
                    if (token == null && accessor.getSessionAttributes() != null) {
                        token = (String) accessor.getSessionAttributes().get("token");
                    }

                    if (token != null) {
                        try {
                            if (jwtTokenVerifier.isAccessToken(token)) {
                                String username = jwtTokenVerifier.extractUsername(token);
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                accessor.setUser(authentication);
                                log.info("WebSocket authentication successful for user: {}", username);
                            }
                        } catch (Exception e) {
                            log.error("Failed to authenticate WebSocket connection", e);
                        }
                    } else {
                        log.warn("No token found for WebSocket CONNECT");
                    }
                }
                return message;
            }
        });
    }
}
