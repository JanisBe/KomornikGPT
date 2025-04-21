package com.janis.komornikgpt.user;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.janis.komornikgpt.expense.Expense;
import com.janis.komornikgpt.expense.ExpenseSplit;
import com.janis.komornikgpt.group.Group;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.proxy.HibernateProxy;

import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "users")
@Getter
@Setter
@ToString
@RequiredArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    private String name;
    private String surname;

    @Enumerated(EnumType.STRING)
    private Role role;

    @OneToMany(mappedBy = "payer")
    @ToString.Exclude
    @JsonBackReference("user-expenses")
    private List<Expense> expensesPaid;

    @OneToMany(mappedBy = "user")
    @ToString.Exclude
    @JsonBackReference("user-splits")
    private List<ExpenseSplit> splits;

    @ManyToMany(mappedBy = "users")
    @ToString.Exclude
    @JsonBackReference("user-groups")
    private List<Group> groups;

    @Override
    public final boolean equals(Object o) {
        if (this == o) return true;
        if (o == null) return false;
        Class<?> oEffectiveClass = o instanceof HibernateProxy ? ((HibernateProxy) o).getHibernateLazyInitializer().getPersistentClass() : o.getClass();
        Class<?> thisEffectiveClass = this instanceof HibernateProxy ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass() : this.getClass();
        if (thisEffectiveClass != oEffectiveClass) return false;
        User user = (User) o;
        return getId() != null && Objects.equals(getId(), user.getId());
    }

    @Override
    public final int hashCode() {
        return this instanceof HibernateProxy ? ((HibernateProxy) this).getHibernateLazyInitializer().getPersistentClass().hashCode() : getClass().hashCode();
    }
}

