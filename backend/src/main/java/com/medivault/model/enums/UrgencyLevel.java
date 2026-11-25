package com.medivault.model.enums;

public enum UrgencyLevel {
    SELF_CARE(1),
    SEE_DOCTOR(2),
    EMERGENCY(3);

    private final int rank;

    UrgencyLevel(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }

    /** Returns the higher urgency of two levels. */
    public static UrgencyLevel max(UrgencyLevel a, UrgencyLevel b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.rank >= b.rank ? a : b;
    }
}
