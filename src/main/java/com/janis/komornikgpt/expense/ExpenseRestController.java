package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.SettlementDto;
import com.janis.komornikgpt.group.GroupDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseRestController {
    private final ExpenseSettlementService expenseSettlementService;
    private final ExpenseService expenseService;

    @GetMapping("/groups/{groupId}/settlement")
    public List<SettlementDto> getSettlement(@PathVariable Long groupId,
                                             @RequestParam(defaultValue = "false") boolean recalculate) {
        return expenseSettlementService.getSettlementDtos(groupId, recalculate);
    }

    @PostMapping
    public ResponseEntity<ExpenseDto> createExpense(@RequestBody CreateExpenseRequest request, Principal principal) {
        Expense expense = expenseService.createExpense(request, principal);
        return ResponseEntity.ok(ExpenseDto.fromExpense(expense));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ExpenseDto>> getExpensesByGroupId(@PathVariable Long groupId, Principal principal) {
        List<Expense> expenses = expenseService.findAllByGroupId(groupId, principal);
        return ResponseEntity.ok(expenses.stream().map(ExpenseDto::fromExpense).toList());
    }

    @GetMapping("/group/{groupId}/between")
    public ResponseEntity<List<ExpenseDto>> getExpensesByGroupIdAndDateBetween(
            @PathVariable Long groupId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<Expense> expenses = expenseService.findAllByGroupIdAndDateBetween(groupId, startDate, endDate);
        return ResponseEntity.ok(expenses.stream().map(ExpenseDto::fromExpense).toList());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GroupExpensesDto>> getExpensesByPayerId(@PathVariable Long userId) {
        Map<GroupDto, List<ExpenseDto>> allExpenses = expenseService.findAllByPayerId(userId);
        List<GroupExpensesDto> result = new ArrayList<>();
        allExpenses.forEach((groupDto, expenses) ->
                result.add(new GroupExpensesDto(groupDto, expenses)));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/user/{userId}/between")
    public ResponseEntity<List<ExpenseDto>> getExpensesByPayerIdAndDateBetween(
            @PathVariable Long userId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<Expense> expenses = expenseService.findAllByPayerIdAndDateBetween(userId, startDate, endDate);
        return ResponseEntity.ok(expenses.stream().map(ExpenseDto::fromExpense).toList());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDto> updateExpense(
            @PathVariable Long id,
            @RequestBody UpdateExpenseRequest request,
            Principal principal) {
        Expense expense = expenseService.updateExpense(id, request, principal);
        return ResponseEntity.ok(ExpenseDto.fromExpense(expense));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id, Principal principal) {
        expenseService.deleteExpense(id, principal);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recalculate/{id}")
    public ResponseEntity<ExpenseDto> recalculateExpense(@PathVariable Long id) {
        Expense expense = expenseService.recalculateExpenses(id);
        return ResponseEntity.ok(ExpenseDto.fromExpense(expense));
    }

    @PostMapping("/groups/{groupId}/settle")
    public ResponseEntity<Void> settleGroup(@PathVariable Long groupId) {
        expenseSettlementService.settleGroup(groupId);
        return ResponseEntity.noContent().build();
    }
}
