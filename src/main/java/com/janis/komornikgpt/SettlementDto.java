package com.janis.komornikgpt;

import java.math.BigDecimal;

public class SettlementDto {
    public String from;
    public String to;
    public BigDecimal amount;

    public SettlementDto(String from, String to, BigDecimal amount) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }
}