package vn.acme.paperless_meeting.service.assistant;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Giới hạn số câu hỏi/phút cho mỗi (user, meeting) để tránh spam tốn phí gọi OpenAI.
 * Bộ đếm lưu trong bộ nhớ (đủ dùng cho quy mô 1 instance của đồ án), không cần Redis.
 */
@Component
public class AssistantRateLimiter {

    private static final long WINDOW_SECONDS = 60;

    private final Map<String, Deque<Instant>> requestLog = new ConcurrentHashMap<>();

    public boolean tryAcquire(String key, int limitPerMinute) {
        Instant now = Instant.now();
        Deque<Instant> timestamps = requestLog.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (timestamps) {
            Instant windowStart = now.minusSeconds(WINDOW_SECONDS);
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= limitPerMinute) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }
}
