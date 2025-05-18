package com.janis.komornikgpt.expense;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;

@Table(name = "exchange_rate", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"currencyFrom", "currencyTo", "date"})
})
@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
public class ExchangeRate {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

    @Column(nullable = false)
    private LocalDate date;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
    private Currency currencyFrom;

    @Column(nullable = false)
    private BigDecimal rate;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Currency currencyTo = Currency.PLN;

}
