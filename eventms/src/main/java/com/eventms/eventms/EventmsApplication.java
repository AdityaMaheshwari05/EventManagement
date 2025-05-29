package com.eventms.eventms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class EventmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventmsApplication.class, args);
	}

}

