package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.user.User;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Data
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    private BigDecimal amountOwed;

    // Gettery, settery, konstruktory, equals, hashCode, toString
}

