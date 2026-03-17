package com.janis.komornikgpt.expense;

import lombok.Getter;

@Getter
public enum Currency {

    USD("Dolar amerykański"),
    EUR("Euro"),
    JPY("Jen japoński"),
    GBP("Funt szterling"),
    AUD("Dolar australijski"),
    CAD("Dolar kanadyjski"),
    CHF("Frank szwajcarski"),
    CNY("Juan chiński"),
    SEK("Korona szwedzka"),
    NZD("Dolar nowozelandzki"),

    MXN("Peso meksykańskie"),
    SGD("Dolar singapurski"),
    HKD("Dolar hongkoński"),
    NOK("Korona norweska"),
    KRW("Won południowokoreański"),
    TRY("Lira turecka"),
    RUB("Rubel rosyjski"),
    INR("Rupia indyjska"),
    BRL("Real brazylijski"),
    ZAR("Rand południowoafrykański"),

    DKK("Korona duńska"),
    PLN("Polski złoty"),
    TWD("Nowy dolar tajwański"),
    THB("Baht tajski"),
    MYR("Ringgit malezyjski"),
    IDR("Rupia indonezyjska"),
    CZK("Korona czeska"),
    HUF("Forint węgierski"),
    ILS("Szekel izraelski"),
    CLP("Peso chilijskie"),

    PHP("Peso filipińskie"),
    AED("Dirham ZEA"),
    COP("Peso kolumbijskie"),
    SAR("Rial saudyjski"),
    RON("Lej rumuński"),
    PEN("Sol peruwiański"),
    VND("Dong wietnamski"),
    PKR("Rupia pakistańska"),
    KZT("Tenge kazachstańskie"),
    EGP("Funt egipski");

    private final String description;

    Currency(String description) {
        this.description = description;
    }

}