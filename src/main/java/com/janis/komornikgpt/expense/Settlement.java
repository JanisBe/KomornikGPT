package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.user.User;

import java.math.BigDecimal;

public record Settlement(User from, User to, BigDecimal amount, Currency currency) {
    public Settlement withAddedPLNAmount(BigDecimal newAmount) {
        return new Settlement(this.from(), this.to(), this.amount.add(newAmount), Currency.PLN);
    }
}
