package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.SettlementDto;
import com.janis.komornikgpt.group.Group;
import com.janis.komornikgpt.group.GroupRepository;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseSettlementService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;


    @Transactional(readOnly = true)
    public List<Settlement> settleGroupOptimized(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grupa nie istnieje."));

        List<User> users = group.getUsers();
        List<Expense> expenses = expenseRepository.findAllByGroupId(groupId);

        // 1. Liczymy kto ile zapłacił i ile powinien był zapłacić
        Map<User, BigDecimal> totalPaid = new HashMap<>();
        Map<User, BigDecimal> totalOwed = new HashMap<>();

        for (User user : users) {
            totalPaid.put(user, BigDecimal.ZERO);
            totalOwed.put(user, BigDecimal.ZERO);
        }

        for (Expense expense : expenses) {
            User payer = expense.getPayer();
            BigDecimal amount = expense.getAmount();
            List<ExpenseSplit> splits = expense.getSplits();

            totalPaid.put(payer, totalPaid.get(payer).add(amount));

            for (ExpenseSplit split : splits) {
                User splitUser = split.getUser();
                BigDecimal owed = split.getAmountOwed();
                totalOwed.put(splitUser, totalOwed.get(splitUser).add(owed));
            }
        }

        // 2. Obliczamy salda (co komu zostało lub co powinien oddać)
        Map<User, BigDecimal> balances = new HashMap<>();
        for (User user : users) {
            BigDecimal balance = totalPaid.get(user).subtract(totalOwed.get(user));
            if (balance.compareTo(BigDecimal.ZERO) != 0) {
                balances.put(user, balance);
            }
        }

        // 3. Lecimy z optymalizacją przelewów
        return optimizeSettlements(balances);
    }

    private List<Settlement> optimizeSettlements(Map<User, BigDecimal> balances) {
        List<Settlement> settlements = new ArrayList<>();

        List<UserBalance> creditors = new ArrayList<>();
        List<UserBalance> debtors = new ArrayList<>();

        for (Map.Entry<User, BigDecimal> entry : balances.entrySet()) {
            BigDecimal balance = entry.getValue();
            if (balance.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(new UserBalance(entry.getKey(), balance));
            } else if (balance.compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(new UserBalance(entry.getKey(), balance.negate())); // zapisz jako dodatnie
            }
        }

        // Sortowanie
        creditors.sort((a, b) -> b.amount.compareTo(a.amount)); // najwięksi wierzyciele
        debtors.sort((a, b) -> b.amount.compareTo(a.amount));   // najwięksi dłużnicy

        int i = 0, j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            UserBalance debtor = debtors.get(i);
            UserBalance creditor = creditors.get(j);

            BigDecimal amount = debtor.amount.min(creditor.amount);

            settlements.add(new Settlement(debtor.user, creditor.user, amount));

            debtor.amount = debtor.amount.subtract(amount);
            creditor.amount = creditor.amount.subtract(amount);

            if (debtor.amount.compareTo(BigDecimal.ZERO) == 0) i++;
            if (creditor.amount.compareTo(BigDecimal.ZERO) == 0) j++;
        }

        return settlements;
    }

    @Transactional
    public void createExpense(CreateExpenseRequest request) {
        User payer = userRepository.findById(request.payerId())
                .orElseThrow(() -> new RuntimeException("Nie znaleziono płacącego."));
        Group group = groupRepository.findById(request.groupId())
                .orElseThrow(() -> new RuntimeException("Nie znaleziono grupy."));

        Expense expense = new Expense();
        expense.setPayer(payer);
        expense.setGroup(group);
        expense.setAmount(request.amount());
        expense.setCurrency(request.currency());
        expense.setDescription(request.description());
        expense.setDate(LocalDateTime.now());

        List<ExpenseSplit> splits = new ArrayList<>();
        for (CreateExpenseRequest.ExpenseSplitRequest splitDto : request.splits()) {
            User user = userRepository.findById(splitDto.userId())
                    .orElseThrow(() -> new RuntimeException("Nie znaleziono użytkownika do splitu."));

            ExpenseSplit split = new ExpenseSplit();
            split.setExpense(expense);
            split.setUser(user);
            split.setAmountOwed(splitDto.amountOwed());
            splits.add(split);
        }

        expense.setSplits(splits);
        expenseRepository.save(expense);
    }

    private static class UserBalance {
        User user;
        BigDecimal amount;

        UserBalance(User user, BigDecimal amount) {
            this.user = user;
            this.amount = amount;
        }
    }

    public record Settlement(User from, User to, BigDecimal amount) {

        @Override
        public String toString() {
            return from.getName() + " ➜ " + to.getName() + ": " + amount + " zł";
        }
    }

    public List<SettlementDto> getSettlementDtos(Long groupId) {
        return settleGroupOptimized(groupId).stream()
                .map(s -> new SettlementDto(s.from.getName(), s.to.getName(), s.amount))
                .toList();
    }
}
