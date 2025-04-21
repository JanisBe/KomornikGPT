package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.SettlementDto;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseRestController {
    private final ExpenseSettlementService expenseSettlementService;
    private final ExpenseService expenseService;

    @GetMapping("/groups/{groupId}/settlement")
    public List<SettlementDto> getSettlement(@PathVariable Long groupId) {
        return expenseSettlementService.getSettlementDtos(groupId);
    }

    @PostMapping
    public ResponseEntity<String> createExpense(@RequestBody CreateExpenseRequest request) {
        expenseSettlementService.createExpense(request);
        return ResponseEntity.ok("Wydatek dodany – lecimy z hajsem!");
    }

    @GetMapping("/groups/{groupId}")
    public List<ExpenseDto> getExpensesByGroup(@PathVariable Long groupId) {
        return expenseService.findAllByGroupId(groupId).stream()
                .map(ExpenseDto::fromExpense)
                .collect(Collectors.toList());
    }

    @GetMapping("/groups/{groupId}/date-range")
    public List<ExpenseDto> getExpensesByGroupAndDateRange(
            @PathVariable Long groupId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return expenseService.findAllByGroupIdAndDateBetween(groupId, startDate, endDate).stream()
                .map(ExpenseDto::fromExpense)
                .collect(Collectors.toList());
    }

    @GetMapping("/users/{userId}")
    public List<ExpenseDto> getExpensesByUser(@PathVariable Long userId) {
        return expenseService.findAllByPayerId(userId).stream()
                .map(ExpenseDto::fromExpense)
                .collect(Collectors.toList());
    }

    @GetMapping("/users/{userId}/date-range")
    public List<ExpenseDto> getExpensesByUserAndDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return expenseService.findAllByPayerIdAndDateBetween(userId, startDate, endDate).stream()
                .map(ExpenseDto::fromExpense)
                .collect(Collectors.toList());
    }

    @PutMapping("/{id}")
    public ExpenseDto updateExpense(
            @PathVariable Long id,
            @RequestBody UpdateExpenseRequest request) {
        Expense updatedExpense = expenseService.updateExpense(id, request);
        return ExpenseDto.fromExpense(updatedExpense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
}
