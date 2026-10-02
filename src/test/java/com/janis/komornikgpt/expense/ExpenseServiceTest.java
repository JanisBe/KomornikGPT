package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.group.GroupRepository;
import com.janis.komornikgpt.group.GroupService;
import com.janis.komornikgpt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupService groupService;

    @Mock
    private NBPExchangeService nbpExchangeService;

    @InjectMocks
    private ExpenseService expenseService;

    @Test
    void canUserBeDeletedFromGroup_shouldReturnTrue_whenNoUnpaidDebtsAndNoUnsettledExpensesAsPayer() {
        Long userId = 1L;
        Long groupId = 10L;

        when(expenseRepository.sumUnpaidAmountOwedByUserIdAndGroupId(userId, groupId)).thenReturn(BigDecimal.ZERO);
        when(expenseRepository.countUnpaidExpensesByPayerIdAndGroupId(userId, groupId)).thenReturn(0L);

        boolean result = expenseService.canUserBeDeletedFromGroup(userId, groupId);

        assertTrue(result);
    }

    @Test
    void canUserBeDeletedFromGroup_shouldReturnFalse_whenUserHasUnpaidDebts() {
        Long userId = 1L;
        Long groupId = 10L;

        when(expenseRepository.sumUnpaidAmountOwedByUserIdAndGroupId(userId, groupId)).thenReturn(new BigDecimal("50.00"));
        when(expenseRepository.countUnpaidExpensesByPayerIdAndGroupId(userId, groupId)).thenReturn(0L);

        boolean result = expenseService.canUserBeDeletedFromGroup(userId, groupId);

        assertFalse(result);
    }

    @Test
    void canUserBeDeletedFromGroup_shouldReturnFalse_whenUserIsPayerOfUnpaidExpenses() {
        Long userId = 1L;
        Long groupId = 10L;

        when(expenseRepository.sumUnpaidAmountOwedByUserIdAndGroupId(userId, groupId)).thenReturn(BigDecimal.ZERO);
        when(expenseRepository.countUnpaidExpensesByPayerIdAndGroupId(userId, groupId)).thenReturn(2L);

        boolean result = expenseService.canUserBeDeletedFromGroup(userId, groupId);

        assertFalse(result);
    }
}
