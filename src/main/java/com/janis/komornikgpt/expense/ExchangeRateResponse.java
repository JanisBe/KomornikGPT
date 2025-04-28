package com.janis.komornikgpt.expense;

public record ExchangeRateResponse(
        String table,
        String currency,
        String code,
        Rate[] rates
) {
}
