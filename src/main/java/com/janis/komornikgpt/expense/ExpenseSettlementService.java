package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.SettlementDto;
import com.janis.komornikgpt.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseSettlementService {

    private final ExpenseRepository expenseRepository;
    private final NBPExchangeService nbpExchangeService;

    public List<SettlementDto> getSettlementDtos(Long groupId) {
        return processSettlementsForGroup(groupId).stream()
                .map(s -> new SettlementDto(s.from().getName(), s.to().getName(), s.amount(), s.currency()))
                .toList();
    }

    public List<Settlement> processSettlementsForGroup(Long groupId) {

        List<Expense> expenses = expenseRepository.findAllByGroup_IdAndPaidFalse(groupId);
        Map<Currency, List<Expense>> expensesByCurrency = expenses.stream()
                .collect(Collectors.groupingBy(Expense::getCurrency));

        List<Settlement> allSettlements = new ArrayList<>();

        for (Map.Entry<Currency, List<Expense>> entry : expensesByCurrency.entrySet()) {
            Currency currency = entry.getKey();
            List<Expense> currencyExpenses = entry.getValue();

            List<Settlement> settlements = settlePerCurrency(currencyExpenses, currency);
            allSettlements.addAll(settlements);
        }

        return allSettlements;
    }

    private List<Settlement> settlePerCurrency(List<Expense> expenses, Currency currency) {
        Map<User, BigDecimal> balances = new HashMap<>();

        for (Expense expense : expenses) {
            User payer = expense.getPayer();
            BigDecimal amount = expense.getAmount();

            // Dodajemy zapłaconą kwotę do salda płacącego
            balances.merge(payer, amount, BigDecimal::add);

            // Odejmujemy udziały uczestników
            for (ExpenseSplit split : expense.getSplits()) {
                User participant = split.getUser();
                BigDecimal share = split.getAmountOwed(); // ile ten konkretny user jest winien z tej faktury
                balances.merge(participant, share.negate(), BigDecimal::add);
            }
        }

        return minimizeTransfers(balances, currency);
    }

    private List<Settlement> minimizeTransfers(Map<User, BigDecimal> balances, Currency currency) {
        List<Settlement> settlements = new ArrayList<>();

        // Kolejki dłużników i wierzycieli
        PriorityQueue<Map.Entry<User, BigDecimal>> debtors = new PriorityQueue<>(Map.Entry.comparingByValue());
        PriorityQueue<Map.Entry<User, BigDecimal>> creditors = new PriorityQueue<>((a, b) -> b.getValue().compareTo(a.getValue()));

        for (Map.Entry<User, BigDecimal> entry : balances.entrySet()) {
            BigDecimal value = entry.getValue().setScale(2, RoundingMode.HALF_UP);
            if (value.compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(Map.entry(entry.getKey(), value.abs()));
            } else if (value.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(Map.entry(entry.getKey(), value));
            }
        }

        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            var debtor = debtors.poll();
            var creditor = creditors.poll();

            BigDecimal min = debtor.getValue().min(creditor.getValue());

            settlements.add(new Settlement(
                    debtor.getKey(),
                    creditor.getKey(),
                    min,
                    currency
            ));

            BigDecimal debtorRemaining = debtor.getValue().subtract(min);
            BigDecimal creditorRemaining = creditor.getValue().subtract(min);

            if (debtorRemaining.compareTo(BigDecimal.ZERO) > 0) {
                debtors.add(Map.entry(debtor.getKey(), debtorRemaining));
            }

            if (creditorRemaining.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(Map.entry(creditor.getKey(), creditorRemaining));
            }
        }

        return settlements;
    }

    @Transactional
    public void settleGroup(Long groupId) {
        List<Expense> allUnpaidExpenses = expenseRepository.findAllByGroup_IdAndPaidFalse(groupId);
        allUnpaidExpenses.forEach(expense -> expense.setPaid(true));

        expenseRepository.saveAll(allUnpaidExpenses);
    }

}
