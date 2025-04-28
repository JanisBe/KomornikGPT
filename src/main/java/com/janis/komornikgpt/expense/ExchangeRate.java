package com.janis.komornikgpt.expense;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Date;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Table
@Entity
@Getter
@Setter
@ToString
@RequiredArgsConstructor
public class ExchangeRate {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private LocalDateTime date;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Currency currencyFrom = Currency.PLN;


	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Currency currencyTo = Currency.PLN;

}
