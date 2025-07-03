package com.janis.komornikgpt.expense;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Log4j2
@Service
public class NBPExchangeService {

    private static final int MAX_RETRIES = 5;

    private final ExchangeRateRepository exchangeRateRepository;
    private final RestClient restClient;

    @Autowired
    public NBPExchangeService(ExchangeRateRepository exchangeRateRepository,
                              RestClient.Builder restClientBuilder) {
        this.exchangeRateRepository = exchangeRateRepository;
        this.restClient = restClientBuilder.baseUrl("https://api.nbp.pl").build();
    }

    public BigDecimal convertToPln(BigDecimal amount, Currency currency) {
        if (amount == null) {
            throw new IllegalArgumentException("Kwota nie może być null");
        }
        if (currency == null) {
            throw new IllegalArgumentException("Waluta nie może być null");
        }
        if (currency == Currency.PLN) {
            return amount;
        }

        LocalDate currentDate = LocalDate.now();
        int retryCount = 0;

        while (retryCount < MAX_RETRIES) {
            // 1. Check DB for cached rate
            Optional<ExchangeRate> cachedRate = exchangeRateRepository
                    .findByCurrencyFromAndCurrencyToAndDate(currency, Currency.PLN, currentDate);
            if (cachedRate.isPresent()) {
                return amount.multiply(cachedRate.get().getRate())
                        .setScale(2, RoundingMode.HALF_DOWN);
            }

            // 2. If not in DB, fetch from NBP
            String formattedDate = currentDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
            String url = String.format(
                    "/api/exchangerates/rates/a/%s/%s/?format=json",
                    currency.toString().toLowerCase(), formattedDate);

            try {
                ExchangeRateResponse response = restClient.get()
                        .uri(url)
                        .retrieve()
                        .body(ExchangeRateResponse.class);

                if (response != null && response.rates() != null && response.rates().length > 0) {
                    BigDecimal exchangeRate = response.rates()[0].mid();

                    // Save to DB
                    ExchangeRate newRate = new ExchangeRate();
                    newRate.setCurrencyFrom(currency);
                    newRate.setCurrencyTo(Currency.PLN);
                    newRate.setDate(currentDate);
                    newRate.setRate(exchangeRate);
                    exchangeRateRepository.save(newRate);

                    return amount.multiply(exchangeRate)
                            .setScale(2, RoundingMode.HALF_DOWN);
                } else {
                    log.warn("Otrzymano pustą odpowiedź z API NBP dla daty {}", formattedDate);
                }
            } catch (RestClientResponseException e) {
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
