package com.eventms.eventms.dto;

import com.eventms.eventms.entity.EventCategory;
import java.time.LocalDateTime;

public class EventSearchRequest {
    private EventCategory category;
    private LocalDateTime fromDate;

    public EventSearchRequest() {}

    // All-args constructor
    public EventSearchRequest(EventCategory category, LocalDateTime fromDate) {
        this.category = category;
        this.fromDate = fromDate;
    }

    public static EventSearchRequest of(EventCategory category, LocalDateTime fromDate) {
        return new EventSearchRequest(category, fromDate);
    }

    // Getters and setters
    public EventCategory getCategory() {
        return category;
    }

    public void setCategory(EventCategory category) {
        this.category = category;
    }

    public LocalDateTime getFromDate() {
        return fromDate;
    }

    public void setFromDate(LocalDateTime fromDate) {
        this.fromDate = fromDate;
    }
}