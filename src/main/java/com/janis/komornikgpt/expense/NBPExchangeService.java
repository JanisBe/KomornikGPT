package com.janis.komornikgpt.expense;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Log4j2
@Service
public class NBPExchangeService {

	private static final int MAX_RETRIES = 5;

	/**
	 * Konwertuje kwotę z podanej waluty na PLN, używając aktualnego kursu z API NBP. Jeśli dla
	 * bieżącego dnia kurs nie jest dostępny, próbuje dla wcześniejszych dni.
	 *
	 * @param amount kwota do przeliczenia
	 * @param currency waluta źródłowa
	 * @return kwota w PLN lub null jeśli konwersja się nie powiodła
	 * @throws IllegalArgumentException gdy dane wejściowe są niepoprawne
	 */
	public BigDecimal convertToPln(BigDecimal amount, Currency currency) {
		if (amount == null) {
			throw new IllegalArgumentException("Kwota nie może być null");
		}
		if (currency == null) {
			throw new IllegalArgumentException("Waluta nie może być null");
		}
		if (currency == Currency.PLN) {
			log.debug("Waluta to już PLN, zwracam oryginalną kwotę");
			return amount;
		}

		log.info("Rozpoczynam konwersję {} {} na PLN", amount, currency);
		LocalDate currentDate = LocalDate.now();
		int retryCount = 0;

		while (retryCount < MAX_RETRIES) {
			String formattedDate = currentDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
			String url = String.format(
				"https://api.nbp.pl/api/exchangerates/rates/a/%s/%s/?format=json",
				currency.toString().toLowerCase(), formattedDate);

			log.debug("Próbuję pobrać kurs dla daty {}: {}", formattedDate, url);
			RestTemplate restTemplate = new RestTemplate();

			try {
				ExchangeRateResponse response = restTemplate.getForObject(url,
					ExchangeRateResponse.class);
				if (response != null && response.rates() != null && response.rates().length > 0) {
					BigDecimal exchangeRate = response.rates()[0].mid();
					BigDecimal result = amount.multiply(exchangeRate)
						.setScale(2, RoundingMode.HALF_DOWN);
					log.info("Konwersja zakończona: {} {} = {} PLN (kurs: {})",
						amount, currency, result, exchangeRate);
					return result;
				} else {
					log.warn("Otrzymano pustą odpowiedź z API NBP dla daty {}", formattedDate);
				}
			} catch (HttpClientErrorException e) {
				if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
					log.debug("Brak kursu dla daty {}, próbuję dla poprzedniego dnia",
						formattedDate);
					currentDate = currentDate.minusDays(1);
					retryCount++;
				} else {
					log.error("Błąd podczas komunikacji z API NBP: {}", e.getMessage(), e);
					throw e;
				}
			} catch (Exception e) {
				log.error("Nieoczekiwany błąd podczas konwersji waluty: {}", e.getMessage(), e);
				throw new RuntimeException("Błąd podczas konwersji waluty", e);
			}
		}

		log.warn("Nie udało się pobrać kursu waluty po {} próbach", MAX_RETRIES);
		throw new RuntimeException(
			"Nie udało się pobrać kursu waluty po " + MAX_RETRIES + " próbach");
	}
}
