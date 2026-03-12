package vn.acme.paperless_meeting.enums;

import java.util.Arrays;

import org.springframework.http.HttpMethod;

public enum PublicEndpoint {
    LOGIN(HttpMethod.POST, "/auth/login"),
    REFRESH(HttpMethod.POST, "/auth/refresh"),
    CSRF(HttpMethod.GET, "/csrf"),
    HEALTH(HttpMethod.GET, "/actuator/health"),
    SWAGGER(HttpMethod.GET, "/swagger-ui/**"),
    API_DOCS(HttpMethod.GET, "/v3/api-docs/**"),
    REGISTER(HttpMethod.POST, "/auth/register");

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