package com.janis.komornikgpt.exception;

public class TokenAlreadyExistsException extends RuntimeException {
    public TokenAlreadyExistsException(String message) {
        super(message);
    }
} 