package com.janis.komornikgpt.expense;

import com.janis.komornikgpt.group.Group;
import com.janis.komornikgpt.user.User;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private User payer;

    private BigDecimal amount;

    private LocalDateTime date;

    @ManyToOne(fetch = FetchType.LAZY)
    private Group group;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseSplit> splits;

    // Gettery, settery, konstruktory i cała reszta mechaniki
}
