package com.janis.komornikgpt.expense;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT e FROM Expense e WHERE e.group.id = :groupId AND e.date BETWEEN :startDate AND :endDate")
    List<Expense> findAllByGroupIdAndDateBetween(
        @Param("groupId") Long groupId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    List<Expense> findAllByPayerIdOrderByDateDesc(Long userId);
    
    @Query("SELECT e FROM Expense e WHERE e.payer.id = :userId AND e.date BETWEEN :startDate AND :endDate")
    List<Expense> findAllByPayerIdAndDateBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    List<Expense> findAllByGroupIdOrderByDateDesc(Long groupId);

    List<Expense> findAllByGroup_IdAndPaidFalse(Long groupId);

    @Query("SELECT SUM(es.amountOwed) FROM ExpenseSplit es WHERE es.user.id = :userId AND es.expense.group.id = :groupId AND es.expense.paid = false")
    BigDecimal sumUnpaidAmountOwedByUserIdAndGroupId(@Param("userId") Long userId, @Param("groupId") Long groupId);

    @Query("SELECT COUNT(es.amountOwed) FROM ExpenseSplit es WHERE es.user.id = :userId AND es.expense.group.id = :groupId AND es.expense.paid = false")
    BigDecimal countUnpaidAmountOwedByUserIdAndGroupId(@Param("userId") Long userId, @Param("groupId") Long groupId);

}
