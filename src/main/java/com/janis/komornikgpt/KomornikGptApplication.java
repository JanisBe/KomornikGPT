package com.janis.komornikgpt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class KomornikGptApplication {

    public static void main(String[] args) {
        SpringApplication.run(KomornikGptApplication.class, args);
    }

}
