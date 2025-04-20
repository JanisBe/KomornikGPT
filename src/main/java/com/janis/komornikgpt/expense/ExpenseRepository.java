package com.janis.komornikgpt.expense;

import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findAllByGroupId(Long groupId);
    
    @Query("SELECT e FROM Expense e WHERE e.group.id = :groupId AND e.date BETWEEN :startDate AND :endDate")
    List<Expense> findAllByGroupIdAndDateBetween(
        @Param("groupId") Long groupId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    List<Expense> findAllByPayerId(Long userId);
    
    @Query("SELECT e FROM Expense e WHERE e.payer.id = :userId AND e.date BETWEEN :startDate AND :endDate")
    List<Expense> findAllByPayerIdAndDateBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    // Query by Example support
    <S extends Expense> Page<S> findAll(Example<S> example, Pageable pageable);
}
