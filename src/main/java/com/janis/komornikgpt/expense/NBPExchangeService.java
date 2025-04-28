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

	LocalDate today = LocalDate.now();

	public BigDecimal callNbpApi(BigDecimal amount, Currency currency) {
		int retryCount = 0;
		BigDecimal result = null;
		int MAX_RETRIES = 5;
		while (retryCount < MAX_RETRIES) {
			String formattedDate = today.format(DateTimeFormatter.ISO_LOCAL_DATE);
			String url = String.format(
				"https://api.nbp.pl/api/exchangerates/rates/a/%s/%s/?format=json",
				currency, formattedDate);
			RestTemplate restTemplate = new RestTemplate();
			try {
				ExchangeRateResponse response = restTemplate.getForObject(url,
					ExchangeRateResponse.class);
				if (response != null) {
					result = response.rates()[0].mid().multiply(amount)
						.setScale(2, RoundingMode.DOWN);
					break;
				}
			} catch (HttpClientErrorException e) {
				if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
					today = today.minusDays(1);
					retryCount++;
				} else {
					throw e;
				}
			}
		}
		return result;
	}
//    public BigDecimal getExchangeRate(BigDecimal debts) throws RestClientException {
//
//        List<ExpenseSplit> result = new ArrayList<>();
//        debts.forEach(amount -> {
//            try {
//                ExpenseSplit response = callNbpApi(amount);
//                if (response != null) {
//                    result.add(response);
//                }
//            } catch (HttpClientErrorException e) {
//                throw new RuntimeException(e);
//            }
//        });
//        return result;

//    }
}
