package vn.acme.paperless_meeting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PaperlessMeetingApplication {

	public static void main(String[] args) {
		SpringApplication.run(PaperlessMeetingApplication.class, args);
	}

}
