package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import com.janis.komornikgpt.group.Group;
import com.janis.komornikgpt.group.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public List<Expense> findAllByGroupId(Long groupId) {
        return expenseRepository.findAllByGroupId(groupId);
    }

    public List<Expense> findAllByGroupIdAndDateBetween(Long groupId, LocalDateTime startDate, LocalDateTime endDate) {
        return expenseRepository.findAllByGroupIdAndDateBetween(groupId, startDate, endDate);
    }

    public List<Expense> findAllByPayerId(Long userId) {
        return expenseRepository.findAllByPayerId(userId);
    }

    public List<Expense> findAllByPayerIdAndDateBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        return expenseRepository.findAllByPayerIdAndDateBetween(userId, startDate, endDate);
    }

    @Transactional
    public Expense updateExpense(Long id, UpdateExpenseRequest request) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ExpenseNotFoundException("Expense not found with id: " + id));

        if (request.payerId() != null) {
            User payer = userRepository.findById(request.payerId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + request.payerId()));
            expense.setPayer(payer);
        }

        if (request.groupId() != null) {
            Group group = groupRepository.findById(request.groupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + request.groupId()));
            expense.setGroup(group);
        }

        if (request.amount() != null) {
            expense.setAmount(request.amount());
        }

        if (request.splits() != null && !request.splits().isEmpty()) {
            // Clear existing splits
            expense.getSplits().clear();
            
            // Add new splits
            request.splits().forEach(splitDto -> {
                User user = userRepository.findById(splitDto.userId())
                        .orElseThrow(() -> new RuntimeException("User not found with id: " + splitDto.userId()));
                
                ExpenseSplit split = new ExpenseSplit();
                split.setUser(user);
                split.setAmountOwed(splitDto.amountOwed());
                split.setExpense(expense);
                
                expense.getSplits().add(split);
            });
        }

        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new ExpenseNotFoundException("Expense not found with id: " + id);
        }
        expenseRepository.deleteById(id);
    }
} 