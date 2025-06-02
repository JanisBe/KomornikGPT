package com.janis.komornikgpt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.web.client.RestClient;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Bean
	public JavaMailSender javaMailSender() {
		return new JavaMailSenderImpl();
	}

	@Bean
	public RestClient restClient(RestClient.Builder builder) {
		return builder.build();
	}

}