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

    @Query("SELECT DISTINCT e FROM Expense e JOIN FETCH e.payer LEFT JOIN FETCH e.splits s LEFT JOIN FETCH s.user WHERE e.payer.id = :userId ORDER BY e.date DESC")
    List<Expense> findAllByPayerIdOrderByDateDesc(@Param("userId") Long userId);
    
    @Query("SELECT e FROM Expense e WHERE e.payer.id = :userId AND e.date BETWEEN :startDate AND :endDate")
    List<Expense> findAllByPayerIdAndDateBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT DISTINCT e FROM Expense e JOIN FETCH e.payer LEFT JOIN FETCH e.splits s LEFT JOIN FETCH s.user WHERE e.group.id = :groupId ORDER BY e.date DESC")
    List<Expense> findAllByGroupIdOrderByDateDesc(@Param("groupId") Long groupId);

    @Query("SELECT DISTINCT e FROM Expense e JOIN FETCH e.payer LEFT JOIN FETCH e.splits s LEFT JOIN FETCH s.user WHERE e.group.id = :groupId AND e.paid = false")
    List<Expense> findAllByGroup_IdAndPaidFalse(@Param("groupId") Long groupId);

    @Query("SELECT SUM(es.amountOwed) FROM ExpenseSplit es WHERE es.user.id = :userId AND es.expense.group.id = :groupId AND es.expense.paid = false")
    BigDecimal sumUnpaidAmountOwedByUserIdAndGroupId(@Param("userId") Long userId, @Param("groupId") Long groupId);

    @Query("SELECT COUNT(e) FROM Expense e WHERE e.payer.id = :userId AND e.group.id = :groupId AND e.paid = false")
    long countUnpaidExpensesByPayerIdAndGroupId(@Param("userId") Long userId, @Param("groupId") Long groupId);
}
