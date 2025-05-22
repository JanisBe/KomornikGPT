package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.group.GroupDto;

import java.util.List;

public record GroupExpensesDto(GroupDto group, List<ExpenseDto> expenses) {
}
