package com.janis.komornikgpt.user;

import com.janis.komornikgpt.expense.Expense;
import com.janis.komornikgpt.expense.ExpenseSplit;
import com.janis.komornikgpt.group.Group;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Entity
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    private String name;
    @NotBlank
    private String surname;
    @NotBlank
    @Column(unique = true)
    private String email;
    @NotBlank
    @Column(unique = true)
    private String username;
    @NotBlank
    private String password;
    @OneToMany(mappedBy = "payer")
    private List<Expense> expensesPaid;

    @OneToMany(mappedBy = "user")
    private List<ExpenseSplit> splits;

    @ManyToMany(mappedBy = "users")
    private List<Group> groups;
}

