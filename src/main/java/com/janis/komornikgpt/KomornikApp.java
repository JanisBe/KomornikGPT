package com.janis.komornikgpt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class KomornikApp {

    public static void main(String[] args) {
        SpringApplication.run(KomornikApp.class, args);
    }

}
