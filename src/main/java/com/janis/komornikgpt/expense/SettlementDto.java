package com.janis.komornikgpt.expense;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SettlementDto {
    public String from;
    public String to;
    public BigDecimal amount;
    public Currency currency;

    public SettlementDto(String from, String to, BigDecimal amount, Currency currency) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.currency = currency;
    }
}