package com.janis.komornikgpt.expense;

import java.math.BigDecimal;

public interface SplitDtoBase {
    Long userId();

    BigDecimal amountOwed();
}
