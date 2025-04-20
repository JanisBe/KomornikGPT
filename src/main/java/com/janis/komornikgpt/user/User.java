package com.janis.komornikgpt.user;

import com.janis.komornikgpt.expense.Expense;
import com.janis.komornikgpt.expense.ExpenseSplit;
import com.janis.komornikgpt.group.Group;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;
    private String surname;

    @Enumerated(EnumType.STRING)
    private Role role;

    @OneToMany(mappedBy = "payer")
    private List<Expense> expensesPaid;

    @OneToMany(mappedBy = "user")
    private List<ExpenseSplit> splits;

    @ManyToMany(mappedBy = "users")
    private List<Group> groups;
}

