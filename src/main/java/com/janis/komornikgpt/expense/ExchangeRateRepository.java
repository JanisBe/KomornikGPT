package com.janis.komornikgpt.expense;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    Optional<ExchangeRate> findByCurrencyFromAndCurrencyToAndDate(
            Currency currencyFrom, Currency currencyTo, LocalDate date);
}