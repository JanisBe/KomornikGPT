package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.group.GroupDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Expense", description = "Endpointy do zarządzania wydatkami w grupach")
public class ExpenseRestController {
    private final ExpenseSettlementService expenseSettlementService;
    private final ExpenseService expenseService;

    @GetMapping("/groups/{groupId}/settlement")
    @Operation(summary = "Pobierz rozliczenie grupy", description = "Zwraca ostateczne rozliczenie (kto komu ile jest dłużny) dla całej grupy.")
    public List<SettlementDto> getSettlement(@PathVariable Long groupId,
                                             @RequestParam(defaultValue = "false") boolean recalculate) {
        return expenseSettlementService.getSettlementDtos(groupId, recalculate);
    }

    @GetMapping("/group/{groupId}/has-unpaid")
    @Operation(summary = "Sprawdź nieopłacone wydatki", description = "Zwraca true, jeśli w grupie istnieją nieopłacone wydatki.")
    public ResponseEntity<Boolean> hasUnpaidExpenses(@PathVariable Long groupId) {
        return ResponseEntity.ok(expenseService.hasUnpaidExpenses(groupId));
    }

    @PostMapping
    @Operation(summary = "Dodaj wydatek", description = "Aplikuje nowy wydatek dla grupy na podstawie danych i proporcji podziału.")
    public ResponseEntity<ExpenseDto> createExpense(@RequestBody CreateExpenseRequest request, Principal principal) {
        Expense expense = expenseService.createExpense(request, principal);
        return ResponseEntity.ok(ExpenseDto.fromExpense(expense));
    }

    @GetMapping("/group/{groupId}")
    @Operation(summary = "Pobierz wszystkie wydatki grupy", description = "Zwraca pełną lub częściową listę zweryfikowanych wydatków z wybranej grupy.")
    public ResponseEntity<List<ExpenseDto>> getExpensesByGroupId(@PathVariable Long groupId,
                                                                 @RequestParam(required = false) String viewToken, Principal principal) {
        List<Expense> expenses = expenseService.findAllByGroupId(groupId, principal, viewToken);
        return ResponseEntity.ok(expenses.stream().map(ExpenseDto::fromExpense).toList());
    }

    @GetMapping("/group/{groupId}/between")
    @Operation(summary = "Pobierz wydatki z zakresu dat (Grupa)")
    public ResponseEntity<List<ExpenseDto>> getExpensesByGroupIdAndDateBetween(
            @PathVariable Long groupId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<Expense> expenses = expenseService.findAllByGroupIdAndDateBetween(groupId, startDate, endDate);
        return ResponseEntity.ok(expenses.stream().map(ExpenseDto::fromExpense).toList());
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Pobierz wydatki użytkownika", description = "Zwraca pogrupowaną listę wydatków dla danego użytkownika z różnych grup.")
    public ResponseEntity<List<GroupExpensesDto>> getExpensesByPayerId(@PathVariable Long userId) {
        Map<GroupDto, List<ExpenseDto>> allExpenses = expenseService.findAllByPayerId(userId);
        List<GroupExpensesDto> result = new ArrayList<>();
        allExpenses.forEach((groupDto, expenses) -> result.add(new GroupExpensesDto(groupDto, expenses)));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/user/{userId}/between")
    @Operation(summary = "Pobierz wydatki z zakresu dat (Użytkownik)")
    public ResponseEntity<List<ExpenseDto>> getExpensesByPayerIdAndDateBetween(
            @PathVariable Long userId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<Expense> expenses = expenseService.findAllByPayerIdAndDateBetween(userId, startDate, endDate);
        return ResponseEntity.ok(expenses.stream().map(ExpenseDto::fromExpense).toList());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Zaktualizuj wydatek")
    public ResponseEntity<ExpenseDto> updateExpense(
            @PathVariable Long id,
            @RequestBody UpdateExpenseRequest request,
            Principal principal) {
        Expense expense = expenseService.updateExpense(id, request, principal);
        return ResponseEntity.ok(ExpenseDto.fromExpense(expense));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Usuń wydatek")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id, Principal principal) {
        expenseService.deleteExpense(id, principal);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/recalculate/{id}")
    @Operation(summary = "Przelicz ponownie", description = "Wymuś przeliczenie splits ze względu na kursy walut itp.")
    public ResponseEntity<ExpenseDto> recalculateExpense(@PathVariable Long id) {
        Expense expense = expenseService.recalculateExpenses(id);
        return ResponseEntity.ok(ExpenseDto.fromExpense(expense));
    }

    @PostMapping("/groups/{groupId}/settle")
    @Operation(summary = "Rozlicz grupę", description = "Rozlicza zaległe wyliczenia i oznacza długi jako opłacone.")
    public ResponseEntity<Void> settleGroup(@PathVariable Long groupId) {
        expenseSettlementService.settleGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/groups/{groupId}/user/{userId}/can-be-deleted")
    @Operation(summary = "Sprawdź możliwość usunięcia", description = "Zwraca informacje czy dany użytkownik może opuścić daną grupę (brak zaległości).")
    public ResponseEntity<Boolean> canUserBeDeletedFromGroup(@PathVariable Long userId, @PathVariable Long groupId) {
        return ResponseEntity.ok(expenseService.canUserBeDeletedFromGroup(userId, groupId));
    }
}
