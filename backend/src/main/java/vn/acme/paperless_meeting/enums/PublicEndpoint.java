package vn.acme.paperless_meeting.enums;

import java.util.Arrays;

import org.springframework.http.HttpMethod;

public enum PublicEndpoint {
    LOGIN(HttpMethod.POST, "/auth/login"),
    REFRESH(HttpMethod.POST, "/auth/refresh"),
    LOGOUT(HttpMethod.POST, "/auth/logout"),
    HEALTH(HttpMethod.GET, "/actuator/health"),
    SWAGGER(HttpMethod.GET, "/swagger-ui/**"),
    API_DOCS(HttpMethod.GET, "/v3/api-docs/**"),

    // Khách mời không cần đăng nhập
    PUBLIC_INVITE(HttpMethod.GET, "/meetings/public/invite"),
    PUBLIC_RSVP(HttpMethod.PUT, "/meetings/public/rsvp"),
    PUBLIC_MEETING(HttpMethod.GET, "/meetings/public"),
    PUBLIC_DOCUMENTS(HttpMethod.GET, "/meetings/public/documents"),
    PUBLIC_DOWNLOAD_DOCUMENT(HttpMethod.GET, "/meetings/public/documents/*/download"),
    PUBLIC_RSVP_CONFIRM(HttpMethod.GET, "/meetings/public/rsvp/confirm"),
    PUBLIC_AGENDA_ITEMS(HttpMethod.GET, "/meetings/public/agenda-items"),
    PUBLIC_SPEAKERS_QUEUE(HttpMethod.GET, "/meetings/public/speakers/queue"),
    PUBLIC_MOTIONS(HttpMethod.GET, "/meetings/public/motions"),
    PUBLIC_VOTE_STATISTICS(HttpMethod.GET, "/meetings/public/motions/*/vote-statistics"),
    PUBLIC_OPINIONS(HttpMethod.GET, "/meetings/public/opinions"),
    PUBLIC_CREATE_OPINION(HttpMethod.POST, "/meetings/public/opinions"),
    PUBLIC_ATTENDEES(HttpMethod.GET, "/meetings/public/attendees"),
    PUBLIC_UPDATE_ATTENDANCE(HttpMethod.PUT, "/meetings/public/attendees/attendance"),
    PUBLIC_VOTE(HttpMethod.POST, "/meetings/public/motions/*/vote"),
    PUBLIC_SPEAKERS_REQUEST(HttpMethod.POST, "/meetings/public/speakers/request"),

    // Cấu hình các route test
    TEST_EMAIL(HttpMethod.POST, "/test/email/**");


    private final HttpMethod method;
    private final String path;

    PublicEndpoint(HttpMethod method, String path) {
        this.method = method;
        this.path = path;
    }

    public HttpMethod getMethod() {
        return method;
    }

    public String getPath() {
        return path;
    }

    public static PublicEndpoint[] all() {
        return values();
    }

    public static String[] allPaths() {
        return Arrays.stream(values())
                .map(PublicEndpoint::getPath)
                .toArray(String[]::new);
    }
}
