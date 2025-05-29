package com.eventms.eventms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean isCancelled = false;

    @ManyToOne
    private Event event;

    @ManyToOne
    private User attendee;

    private LocalDateTime bookedAt = LocalDateTime.now();
    private boolean cancelled = false;

    public Booking() {}

    public Booking(Event event, User attendee) {
        this.event = event;
        this.attendee = attendee;
    }

    public Long getId() {
        return id;
    }

    public Event getEvent() {
        return event;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public User getAttendee() {
        return attendee;
    }

    public void setAttendee(User attendee) {
        this.attendee = attendee;
    }

    public boolean isCancelled() {
        return cancelled;
    }

    public void setCancelled(boolean cancelled) {
        this.cancelled = cancelled;
    }

    public LocalDateTime getBookedAt() {
        return bookedAt;
    }

    public Boolean getIsCancelled() {
        return isCancelled;
    }

    public void setIsCancelled(Boolean isCancelled) {
        this.isCancelled = isCancelled;
    }
}
