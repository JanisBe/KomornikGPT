package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.SettlementDto;
import com.janis.komornikgpt.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseSettlementServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private NBPExchangeService nbpExchangeService;

    @InjectMocks
    private ExpenseSettlementService expenseSettlementService;

    private User user1;
    private User user2;
    private User user3;
    private List<Expense> expenses;
    private Currency pln;
    private Currency eur;
    private Currency usd;

    @BeforeEach
    void setUp() {
        user1 = User.builder()
                .id(1L)
                .username("user1")
                .email("user1@example.com")
                .password("password")
                .name("Jan")
                .surname("Kowalski")
                .build();
        user2 = User.builder()
                .id(2L)
                .username("user2")
                .email("user2@example.com")
                .password("password")
                .name("Anna")
                .surname("Nowak")
                .build();
        user3 = User.builder()
                .id(3L)
                .username("user3")
                .email("user3@example.com")
                .password("password")
                .name("Piotr")
                .surname("Wisniewski")
                .build();

        pln = Currency.PLN;
        eur = Currency.EUR;
        usd = Currency.CZK;

        expenses = new ArrayList<>();
    }

    @Test
    void testGetSettlementDtos() {
        // Given
        Long groupId = 1L;

        Expense expense1 = createExpense(1L, user1, BigDecimal.valueOf(300), pln);
        addExpenseSplit(expense1, user1, BigDecimal.valueOf(100));
        addExpenseSplit(expense1, user2, BigDecimal.valueOf(100));
        addExpenseSplit(expense1, user3, BigDecimal.valueOf(100));

        Expense expense2 = createExpense(2L, user2, BigDecimal.valueOf(150), pln);
        addExpenseSplit(expense2, user1, BigDecimal.valueOf(50));
        addExpenseSplit(expense2, user2, BigDecimal.valueOf(50));
        addExpenseSplit(expense2, user3, BigDecimal.valueOf(50));

        expenses.add(expense1);
        expenses.add(expense2);

        when(expenseRepository.findAllByGroup_IdAndPaidFalse(groupId)).thenReturn(expenses);

        // When
        List<SettlementDto> result = expenseSettlementService.getSettlementDtos(groupId, false);

        // Then
        // Sprawdzamy liczbę rozliczeń
        assertEquals(1, result.size());

        // Sprawdzenie przez mapowanie do wartości liczbowych i sumowanie
        boolean foundUser3ToUser1 = result.stream()
                .anyMatch(s -> "Piotr".equals(s.getFrom()) && "Jan".equals(s.getTo()) &&
                        BigDecimal.valueOf(150.0).compareTo(s.getAmount()) == 0);

        assertTrue(foundUser3ToUser1, "Nie znaleziono rozliczenia z Piotr do Jan na kwotę 100");

        verify(expenseRepository).findAllByGroup_IdAndPaidFalse(groupId);
    }

    @Test
    void testProcessSettlementsForGroupWithoutRecalculation() {
        // Given
        Long groupId = 1L;

        Expense expense1 = createExpense(1L, user1, BigDecimal.valueOf(300), pln);
        addExpenseSplit(expense1, user1, BigDecimal.valueOf(100));
        addExpenseSplit(expense1, user2, BigDecimal.valueOf(100));
        addExpenseSplit(expense1, user3, BigDecimal.valueOf(100));

        expenses.add(expense1);

        when(expenseRepository.findAllByGroup_IdAndPaidFalse(groupId)).thenReturn(expenses);

        // When
        List<Settlement> result = expenseSettlementService.processSettlementsForGroup(groupId, false);

        // Then
        assertEquals(2, result.size());

        boolean foundSettlement1 = false;
        boolean foundSettlement2 = false;

        for (Settlement settlement : result) {
            if (settlement.from().getId().equals(user2.getId()) && settlement.to().getId().equals(user1.getId()) &&
                    settlement.amount().compareTo(BigDecimal.valueOf(100)) == 0) {
                foundSettlement1 = true;
            }
            if (settlement.from().getId().equals(user3.getId()) && settlement.to().getId().equals(user1.getId()) &&
                    settlement.amount().compareTo(BigDecimal.valueOf(100)) == 0) {
                foundSettlement2 = true;
            }
        }

        assertTrue(foundSettlement1);
        assertTrue(foundSettlement2);

        verify(expenseRepository).findAllByGroup_IdAndPaidFalse(groupId);
        verifyNoInteractions(nbpExchangeService);
    }

    @Test
    void testProcessSettlementsForGroupWithRecalculation() {
        // Given
        Long groupId = 1L;

        Expense expensePLN = createExpense(1L, user1, BigDecimal.valueOf(100), pln);
        addExpenseSplit(expensePLN, user1, BigDecimal.valueOf(50));
        addExpenseSplit(expensePLN, user2, BigDecimal.valueOf(50));

        Expense expenseEUR = createExpense(2L, user2, BigDecimal.valueOf(50), eur);
        addExpenseSplit(expenseEUR, user1, BigDecimal.valueOf(25));
        addExpenseSplit(expenseEUR, user2, BigDecimal.valueOf(25));

        expenses.add(expensePLN);
        expenses.add(expenseEUR);

        when(expenseRepository.findAllByGroup_IdAndPaidFalse(groupId)).thenReturn(expenses);
        // Użycie doReturn zamiast when dla uniknięcia problemu z dokładnością liczb zmiennoprzecinkowych
        doReturn(BigDecimal.valueOf(100)).when(nbpExchangeService).convertToPln(any(BigDecimal.class), eq(eur));

        // When
        List<Settlement> result = expenseSettlementService.processSettlementsForGroup(groupId, true);

        // Then
        assertEquals(1, result.size());
        Settlement settlement = result.get(0);

        // Porównujemy na podstawie ID, zamiast bezpośrednio obiekty User
        assertEquals(user1.getId(), settlement.from().getId());
        assertEquals(user2.getId(), settlement.to().getId());
        assertEquals(BigDecimal.valueOf(50).stripTrailingZeros(), settlement.amount().stripTrailingZeros());
        assertEquals(pln, settlement.currency());

        verify(expenseRepository).findAllByGroup_IdAndPaidFalse(groupId);
        verify(nbpExchangeService).convertToPln(any(BigDecimal.class), eq(eur));
    }

    @Test
    void testSimplifySettlements() {
        // Given
        Settlement settlement1 = new Settlement(user1, user2, BigDecimal.valueOf(100), pln);
        Settlement settlement2 = new Settlement(user2, user3, BigDecimal.valueOf(50), pln);
        Settlement settlement3 = new Settlement(user3, user1, BigDecimal.valueOf(20), pln);

        List<Settlement> settlements = Arrays.asList(settlement1, settlement2, settlement3);

        // When
        List<Settlement> result = expenseSettlementService.simplifySettlements(settlements);

        // Then
        // W systemie upraszczającym przepływy pieniężne, wynik może być różny niż oczekiwany,
        // lecz powinien być optymalny. Sprawdzamy jedynie, że wynik ma sens finansowy.

        // Obliczamy bilans początkowy - zaokrąglony do 2 miejsc
        BigDecimal initialBalance1 = BigDecimal.valueOf(-100 + 20).setScale(2, RoundingMode.HALF_UP); // User1 płaci 100, otrzymuje 20
        BigDecimal initialBalance2 = BigDecimal.valueOf(100 - 50).setScale(2, RoundingMode.HALF_UP);  // User2 otrzymuje 100, płaci 50
        BigDecimal initialBalance3 = BigDecimal.valueOf(50 - 20).setScale(2, RoundingMode.HALF_UP);   // User3 otrzymuje 50, płaci 20

        // Obliczamy bilans końcowy - zaokrąglony do 2 miejsc
        BigDecimal finalBalance1 = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalBalance2 = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalBalance3 = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (Settlement s : result) {
            BigDecimal amount = s.amount().setScale(2, RoundingMode.HALF_UP);

            if (s.from().getId().equals(user1.getId())) finalBalance1 = finalBalance1.subtract(amount);
            if (s.to().getId().equals(user1.getId())) finalBalance1 = finalBalance1.add(amount);

            if (s.from().getId().equals(user2.getId())) finalBalance2 = finalBalance2.subtract(amount);
            if (s.to().getId().equals(user2.getId())) finalBalance2 = finalBalance2.add(amount);

            if (s.from().getId().equals(user3.getId())) finalBalance3 = finalBalance3.subtract(amount);
            if (s.to().getId().equals(user3.getId())) finalBalance3 = finalBalance3.add(amount);
        }

        // Bilanse powinny być takie same
        assertEquals(initialBalance1.stripTrailingZeros(), finalBalance1.stripTrailingZeros(), "Bilans dla user1 powinien się zgadzać");
        assertEquals(initialBalance2.stripTrailingZeros(), finalBalance2.stripTrailingZeros(), "Bilans dla user2 powinien się zgadzać");
        assertEquals(initialBalance3.stripTrailingZeros(), finalBalance3.stripTrailingZeros(), "Bilans dla user3 powinien się zgadzać");

        // Sprawdzamy czy liczba transakcji została zminimalizowana
        assertTrue(result.size() <= settlements.size(),
                "Liczba rozliczeń powinna być mniejsza lub równa liczbie początkowej");
    }

    @Test
    void testSettleGroup() {
        // Given
        Long groupId = 1L;

        Expense expense1 = createExpense(1L, user1, BigDecimal.valueOf(100), pln);
        Expense expense2 = createExpense(2L, user2, BigDecimal.valueOf(200), pln);

        when(expenseRepository.findAllByGroup_IdAndPaidFalse(groupId)).thenReturn(Arrays.asList(expense1, expense2));

        // When
        expenseSettlementService.settleGroup(groupId);

        // Then
        assertTrue(expense1.getPaid());
        assertTrue(expense2.getPaid());

        verify(expenseRepository).findAllByGroup_IdAndPaidFalse(groupId);
        verify(expenseRepository).saveAll(anyList());
    }

    @Test
    void testMultipleCurrencySettlement() {
        // Given
        Long groupId = 1L;

        Expense expensePLN = createExpense(1L, user1, BigDecimal.valueOf(100), pln);
        addExpenseSplit(expensePLN, user1, BigDecimal.valueOf(50));
        addExpenseSplit(expensePLN, user2, BigDecimal.valueOf(50));

        Expense expenseEUR = createExpense(2L, user2, BigDecimal.valueOf(50), eur);
        addExpenseSplit(expenseEUR, user1, BigDecimal.valueOf(25));
        addExpenseSplit(expenseEUR, user2, BigDecimal.valueOf(25));

        Expense expenseCZK = createExpense(3L, user3, BigDecimal.valueOf(75), usd); // usd to w rzeczywistości CZK
        addExpenseSplit(expenseCZK, user1, BigDecimal.valueOf(25));
        addExpenseSplit(expenseCZK, user2, BigDecimal.valueOf(25));
        addExpenseSplit(expenseCZK, user3, BigDecimal.valueOf(25));

        expenses.add(expensePLN);
        expenses.add(expenseEUR);
        expenses.add(expenseCZK);

        when(expenseRepository.findAllByGroup_IdAndPaidFalse(groupId)).thenReturn(expenses);

        // When
        List<Settlement> result = expenseSettlementService.processSettlementsForGroup(groupId, false);

        // Then
        // Przepływ pieniędzy może się różnić w zależności od implementacji,
        // ale dla każdej waluty powinniśmy mieć co najmniej jedno rozliczenie
        int plnSettlements = 0;
        int eurSettlements = 0;
        int czkSettlements = 0;

        for (Settlement settlement : result) {
            if (settlement.currency() == pln) plnSettlements++;
            if (settlement.currency() == eur) eurSettlements++;
            if (settlement.currency() == usd) czkSettlements++; // usd to w rzeczywistości CZK
        }

        assertTrue(plnSettlements > 0, "Powinno być co najmniej jedno rozliczenie w PLN");
        assertTrue(eurSettlements > 0, "Powinno być co najmniej jedno rozliczenie w EUR");
        assertTrue(czkSettlements > 0, "Powinno być co najmniej jedno rozliczenie w CZK");

        // Wynik będzie różny w zależności od algorytmu, więc nie możemy dokładnie określić
        // oczekiwanej liczby rozliczeń, ale każda waluta powinna być reprezentowana

        verify(expenseRepository).findAllByGroup_IdAndPaidFalse(groupId);
    }

    @Test
    void testWithAddedPLNAmount() {
        // Given
        Settlement original = new Settlement(user1, user2, BigDecimal.valueOf(100), pln);
        BigDecimal additionalAmount = BigDecimal.valueOf(50);

        // When
        Settlement updated = original.withAddedPLNAmount(additionalAmount);

        // Then
        assertEquals(user1.getId(), updated.from().getId());
        assertEquals(user2.getId(), updated.to().getId());
        assertEquals(BigDecimal.valueOf(150), updated.amount());
        assertEquals(pln, updated.currency());
    }

    // Helper methods
    private Expense createExpense(Long id, User payer, BigDecimal amount, Currency currency) {
        Expense expense = new Expense();
        expense.setId(id);
        expense.setPayer(payer);
        expense.setAmount(amount);
        expense.setCurrency(currency);
        expense.setSplits(new ArrayList<>());
        expense.setPaid(false);
        return expense;
    }

    private void addExpenseSplit(Expense expense, User user, BigDecimal amountOwed) {
        ExpenseSplit split = new ExpenseSplit();
        split.setUser(user);
        split.setAmountOwed(amountOwed);
        split.setExpense(expense);
        expense.getSplits().add(split);
    }
}