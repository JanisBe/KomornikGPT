package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.exception.ResourceNotFoundException;
import com.janis.komornikgpt.group.Group;
import com.janis.komornikgpt.group.GroupRepository;
import com.janis.komornikgpt.group.GroupService;
import com.janis.komornikgpt.user.User;
import com.janis.komornikgpt.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupService groupService;
    private final NBPExchangeService nbpExchangeService;

    private void assignSplits(UpdateExpenseRequest request, Expense expense) {
        request.splits().forEach(splitDto -> {
            ExpenseSplit split = new ExpenseSplit();
            split.setUser(userRepository.findById(splitDto.userId())
                    .orElseThrow(
                            () -> new RuntimeException("User not found with id: " + splitDto.userId())));
            split.setAmountOwed(splitDto.amountOwed());
            split.setExpense(expense);
            expense.getSplits().add(split);
        });
    }

    @Transactional
    public Expense createExpense(CreateExpenseRequest request, Principal principal) {
        // Check if user is member of the group
        if (!groupService.isUserMemberOfGroup(principal.getName(), request.groupId())) {
            throw new AccessDeniedException("You are not a member of this group");
        }

        User payer = userRepository.findById(request.payerId())
                .orElseThrow(
                        () -> new RuntimeException("User not found with id: " + request.payerId()));
        Group group = groupRepository.findById(request.groupId())
                .orElseThrow(
                        () -> new RuntimeException("Group not found with id: " + request.groupId()));

        Expense expense = new Expense();
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setCurrency(request.currency());
        expense.setDate(request.date());
        expense.setPayer(payer);
        expense.setGroup(group);
        assignSplits();
        request.splits().forEach(splitDto -> {
            ExpenseSplit split = new ExpenseSplit();
            split.setUser(userRepository.findById(splitDto.userId())
                    .orElseThrow(
                            () -> new RuntimeException("User not found with id: " + splitDto.userId())));
            split.setAmountOwed(splitDto.amountOwed());
            split.setExpense(expense);
            expense.getSplits().add(split);
        });

        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id, Principal principal) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        // Check if user is member of the group
        if (!groupService.isUserMemberOfGroup(principal.getName(), expense.getGroup().getId())) {
            throw new AccessDeniedException("You are not a member of this group");
        }

        expenseRepository.delete(expense);
    }

    public List<Expense> findAllByGroupId(Long groupId, Principal principal) {
        // Check if user is member of the group
        if (!groupService.isUserMemberOfGroup(principal.getName(), groupId)) {
            throw new AccessDeniedException("You are not a member of this group");
        }
        return expenseRepository.findAllByGroupIdOrderByDateDesc(groupId);
    }

    public List<Expense> findAllByGroupIdAndDateBetween(Long groupId, LocalDateTime startDate,
                                                        LocalDateTime endDate) {
        return expenseRepository.findAllByGroupIdAndDateBetween(groupId, startDate, endDate);
    }

    public List<Expense> findAllByPayerId(Long userId) {
        return expenseRepository.findAllByPayerId(userId);
    }

    public List<Expense> findAllByPayerIdAndDateBetween(Long userId, LocalDateTime startDate,
                                                        LocalDateTime endDate) {
        return expenseRepository.findAllByPayerIdAndDateBetween(userId, startDate, endDate);
    }

    public Expense recalculateExpenses(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        Expense newExpense = new Expense();
        BigDecimal expenseAmount = nbpExchangeService.convertToPln(expense.getAmount(),
                expense.getCurrency());
        newExpense.setAmount(expenseAmount);
        newExpense.setCurrency(expense.getCurrency());
        newExpense.setDescription(expense.getDescription());
        newExpense.setDate(expense.getDate());
        newExpense.setPayer(expense.getPayer());
        newExpense.setGroup(expense.getGroup());
        List<ExpenseSplit> splits = new ArrayList<>();
        expense.getSplits().forEach(split -> {
            BigDecimal splitAmount = nbpExchangeService.convertToPln(split.getAmountOwed(),
                    expense.getCurrency());
            ExpenseSplit newSplit = new ExpenseSplit();
            newSplit.setUser(split.getUser());
            newSplit.setAmountOwed(splitAmount);
            splits.add(newSplit);
        });
        newExpense.setSplits(splits);
        return newExpense;
    }

    @Transactional
    public Expense updateExpense(Long id, UpdateExpenseRequest request, Principal principal) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        // Check if user is member of the group
        if (!groupService.isUserMemberOfGroup(principal.getName(), expense.getGroup().getId())) {
            throw new AccessDeniedException("You are not a member of this group");
        }

        // Update expense fields
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setCurrency(request.currency());
        expense.setDate(request.date());
        expense.setPayer(userRepository.findById(request.payerId())
                .orElseThrow(
                        () -> new RuntimeException("User not found with id: " + request.payerId())));

        // Update splits
        expense.getSplits().clear();
        assignSplits(request, expense);

        return expenseRepository.save(expense);
    }
}