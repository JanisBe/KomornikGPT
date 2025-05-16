package com.janis.komornikgpt.expense;

import java.util.List;

public interface SplitContainer {
    List<? extends SplitDtoBase> splits();
}
