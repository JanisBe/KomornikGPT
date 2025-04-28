package com.janis.komornikgpt.expense;

import java.math.BigDecimal;

public record Rate(
        String no,
        String effectiveDate,
        BigDecimal mid
) {
}
