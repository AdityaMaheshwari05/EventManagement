package com.eventms.eventms.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public enum EventCategory {
    CONFERENCE, WORKSHOP, SEMINAR, CELEBRATION, TECH, MUSIC, SPORTS, ART;

    @JsonCreator
    public static EventCategory fromString(String value) {
        try {
            return EventCategory.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category: " + value);
        }
    }
}
