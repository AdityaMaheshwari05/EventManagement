package com.eventms.eventms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;

    @Enumerated(EnumType.STRING)
    private EventCategory category;

    private LocalDateTime dateTime;
    private int maxSlots;
    private int availableSlots;
    private boolean cancelled = false;

    @ManyToOne
    @JoinColumn(name = "organizer_id")
    private User organizer;

    @Column(nullable = false)
    private boolean closed = false;

    public Event() {}

    public Event(String title, String description, EventCategory category, LocalDateTime dateTime, int maxSlots, User organizer) {
        if (title == null || description == null || category == null || dateTime == null || organizer == null) {
            throw new IllegalArgumentException("Required fields cannot be null");
        }
        this.title = title;
        this.description = description;
        this.category = category;
        this.dateTime = dateTime;
        this.maxSlots = maxSlots;
        this.availableSlots = maxSlots;
        this.organizer = organizer;
        this.closed = false;
    }


    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public EventCategory getCategory() {
        return category;
    }

    public void setCategory(EventCategory category) {
        this.category = category;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public int getMaxSlots() {
        return maxSlots;
    }

    public void setMaxSlots(int maxSlots) {
        this.maxSlots = maxSlots;
    }

    public int getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(int availableSlots) {
        this.availableSlots = availableSlots;
    }


    @Column(name = "is_cancelled")
    private boolean isCancelled;

    public boolean isCancelled() {
        return isCancelled;
    }

    public void setCancelled(boolean cancelled) {
        this.isCancelled = isCancelled;
    }

    public boolean isClosed() {
        return closed;
    }

    public void setClosed(boolean closed) {
        this.closed = closed;
    }

    public User getOrganizer() {
        return organizer;
    }

    public void setOrganizer(User organizer) {
        this.organizer = organizer;
    }
}
