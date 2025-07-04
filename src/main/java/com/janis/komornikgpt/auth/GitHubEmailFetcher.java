package com.janis.komornikgpt.auth;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;


@Service
public class GitHubEmailFetcher {

	private static final String EMAILS_URL = "https://api.github.com/user/emails";
	private static final String BEARER_PREFIX = "Bearer ";

	private final RestClient restClient;

	public GitHubEmailFetcher(RestClient.Builder restClientBuilder) {
		this.restClient = restClientBuilder.build();
	}

	public String fetchPrimaryEmailAddress(String token) {
				List<GitHubEmailVm> emailVmList = restClient
			.get()
			.uri(EMAILS_URL)
			.header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token)
			.header(HttpHeaders.ACCEPT, "application/vnd.github+json")
			.retrieve()
						.body(new ParameterizedTypeReference<>() {
						});

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
