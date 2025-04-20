package com.janis.komornikgpt.expense;

import java.math.BigDecimal;
import java.util.List;

public class CreateExpenseRequest {
    public Long payerId;
    public Long groupId;
    public BigDecimal amount;
    public List<SplitDto> splits;

    public static class SplitDto {
        public Long userId;
        public BigDecimal amountOwed;
    }
}
