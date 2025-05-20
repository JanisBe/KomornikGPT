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

    public List<SettlementDto> getSettlementDtos(Long groupId, boolean recalculate) {
        return processSettlementsForGroup(groupId, recalculate).stream()
                .map(s -> new SettlementDto(s.from().getName(), s.to().getName(), s.amount(), s.currency()))
                .toList();
    }

    public List<Settlement> processSettlementsForGroup(Long groupId, boolean recalculate) {

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
        if (recalculate) {
            Map<String, Settlement> plnMap = new HashMap<>();

            for (Settlement settlement : allSettlements) {
                if (settlement.currency() == Currency.PLN) {
                    String key = settlement.from().getId() + "->" + settlement.to().getId();
                    plnMap.put(key, settlement);
                }
            }

            for (Settlement settlement : allSettlements) {
                if (settlement.currency() != Currency.PLN) {
                    BigDecimal convertedAmount = nbpExchangeService.convertToPln(settlement.amount(), settlement.currency());
                    String key = settlement.from().getId() + "->" + settlement.to().getId();

                    if (plnMap.containsKey(key)) {
                        Settlement updated = plnMap.get(key).withAddedPLNAmount(convertedAmount);
                        plnMap.put(key, updated);
                    } else {
                        Settlement newPln = new Settlement(settlement.from(), settlement.to(), convertedAmount, Currency.PLN);
                        plnMap.put(key, newPln);
                    }
                }
            }

            return simplifySettlements(new ArrayList<>(plnMap.values()));
        }

        return allSettlements;
    }

    private List<Settlement> settlePerCurrency(List<Expense> expenses, Currency currency) {
        Map<User, BigDecimal> balances = new HashMap<>();

        for (Expense expense : expenses) {
            User payer = expense.getPayer();
            BigDecimal amount = expense.getAmount();

            balances.merge(payer, amount, BigDecimal::add);

            for (ExpenseSplit split : expense.getSplits()) {
                User participant = split.getUser();
                BigDecimal share = split.getAmountOwed();
                balances.merge(participant, share.negate(), BigDecimal::add);
            }
        }

        return minimizeTransfers(balances, currency);
    }

    public List<Settlement> simplifySettlements(List<Settlement> settlements) {
        Map<Currency, Map<User, BigDecimal>> balancesPerCurrency = new HashMap<>();

        for (Settlement settlement : settlements) {
            Currency currency = settlement.currency();
            balancesPerCurrency.putIfAbsent(currency, new HashMap<>());

            Map<User, BigDecimal> balances = balancesPerCurrency.get(currency);

            balances.put(settlement.from(),
                    balances.getOrDefault(settlement.from(), BigDecimal.ZERO).subtract(settlement.amount()));

            balances.put(settlement.to(),
                    balances.getOrDefault(settlement.to(), BigDecimal.ZERO).add(settlement.amount()));
        }

        List<Settlement> minimized = new ArrayList<>();
        for (var entry : balancesPerCurrency.entrySet()) {
            Currency currency = entry.getKey();
            Map<User, BigDecimal> balances = entry.getValue();

            minimized.addAll(minimizeTransfers(balances, currency));
        }

        return minimized;
    }

    private List<Settlement> minimizeTransfers(Map<User, BigDecimal> balances, Currency currency) {
        List<Settlement> settlements = new ArrayList<>();

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
