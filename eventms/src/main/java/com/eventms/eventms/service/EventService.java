package com.eventms.eventms.service;

import com.eventms.eventms.dto.EventSearchRequest;
import com.eventms.eventms.entity.Event;
import com.eventms.eventms.entity.EventCategory;
import com.eventms.eventms.entity.User;
import com.eventms.eventms.exception.EventNotFoundException;
import com.eventms.eventms.repository.EventRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class EventService {
    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public Event createEvent(Event event, User organizer) {
        event.setOrganizer(organizer);
        if (organizer == null) {
            throw new IllegalArgumentException("Organizer cannot be null");
        }

        event.setOrganizer(organizer);
        event.setAvailableSlots(event.getMaxSlots());

        // Save event in the database
        return eventRepository.save(event);
    }

    public List<Event> getEventsByOrganizer(User organizer) {
        return eventRepository.findByOrganizerId(organizer.getId());
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public List<Event> getAvailableEvents() {
        return eventRepository.findByIsCancelledFalse();
    }

    @Transactional
    public void cancelEvent(Long eventId, User organizer) {
        Event event = eventRepository.findByIdAndOrganizer(eventId, organizer)
                .orElseThrow(() -> new EventNotFoundException("Event not found or you don't have permission"));

        if (!event.getOrganizer().equals(organizer)) {
            throw new SecurityException("Only the organizer can cancel this event");
        }

        if (event.isCancelled()) {
            throw new EventNotFoundException("Event already cancelled");
        }
        event.setCancelled(true);
        eventRepository.saveAndFlush(event);
    }

    public Event updateEvent(Long eventId, Event updatedEvent, User organizer) {
        Event existingEvent = eventRepository.findByIdAndOrganizer(eventId, organizer)
                .orElseThrow(() -> new EventNotFoundException("Event not found or unauthorized"));

        if (existingEvent.isCancelled()) {
            throw new IllegalStateException("Cannot modify a cancelled event");
        }

        if (updatedEvent.getDateTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Event date cannot be in the past");
        }

        existingEvent.setTitle(updatedEvent.getTitle());
        existingEvent.setDescription(updatedEvent.getDescription());
        existingEvent.setCategory(updatedEvent.getCategory());
        existingEvent.setDateTime(updatedEvent.getDateTime());

        if (updatedEvent.getMaxSlots() != existingEvent.getMaxSlots()) {
            int slotDifference = updatedEvent.getMaxSlots() - existingEvent.getMaxSlots();
            existingEvent.setMaxSlots(updatedEvent.getMaxSlots());
            existingEvent.setAvailableSlots(existingEvent.getAvailableSlots() + slotDifference);
        }

        return eventRepository.save(existingEvent);
    }

    public List<Event> searchEvents(EventSearchRequest request) {
        if (request == null) {
            return eventRepository.findByIsCancelledFalse();
        }

        return eventRepository.searchEvents(
                request.getCategory(),
                request.getFromDate()
        );
    }
}
