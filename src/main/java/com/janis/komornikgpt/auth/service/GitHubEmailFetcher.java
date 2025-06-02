package com.janis.komornikgpt.auth.service;

import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class GitHubEmailFetcher {

	private static final String EMAILS_URL = "https://api.github.com/user/emails";
	private static final String BEARER_PREFIX = "Bearer ";

	private final WebClient webClient;

	public GitHubEmailFetcher(WebClient.Builder webClientBuilder) {
		this.webClient = webClientBuilder.build();
	}

	public String fetchPrimaryEmailAddress(String token) {
		Mono<List<GitHubEmailVm>> responseMono = webClient
			.get()
			.uri(EMAILS_URL)
			.header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token)
			.header(HttpHeaders.ACCEPT, "application/vnd.github+json")
			.retrieve()
			.bodyToFlux(GitHubEmailVm.class)
			.collectList();

		List<GitHubEmailVm> emailVmList = responseMono.block();

		if (emailVmList == null || emailVmList.isEmpty()) {
			return null;
		}

		return emailVmList.stream()
			.filter(GitHubEmailVm::primary)
			.findFirst()
			.map(GitHubEmailVm::email)
			.orElse(null);
	}

	private record GitHubEmailVm(String email, Boolean primary) {

	}
}
