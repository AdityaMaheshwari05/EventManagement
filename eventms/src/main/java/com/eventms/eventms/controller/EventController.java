package com.eventms.eventms.controller;

import com.eventms.eventms.dto.EventSearchRequest;
import com.eventms.eventms.entity.Event;
import com.eventms.eventms.entity.EventCategory;
import com.eventms.eventms.entity.User;
import com.eventms.eventms.exception.EventNotFoundException;
import com.eventms.eventms.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = { "http://localhost:5500", "http://127.0.0.1:5500" }, allowCredentials = "true")
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<Event> createEvent(
            @RequestBody Event event,
            @AuthenticationPrincipal User organizer
    ) {
        Event createdEvent = eventService.createEvent(event, organizer);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    @GetMapping("/my-events")
    public List<Event> getMyEvents(
            @AuthenticationPrincipal User organizer
    ) {
        return eventService.getEventsByOrganizer(organizer);
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<Event> getEventById(@PathVariable Long eventId) {
        Event event = eventService.getEventById(eventId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return ResponseEntity.ok(event);
    }

    @GetMapping("/available")
    public List<Event> getAvailableEvents() {
        return eventService.getAvailableEvents();
    }

    @PostMapping("/{eventId}/cancel")
    public ResponseEntity<?> cancelEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal User organizer
    ) {
        try {
            eventService.cancelEvent(eventId, organizer);
            return ResponseEntity.ok().body(Map.of(
                    "message", "Event cancelled successfully",
                    "cancelled", true
            ));
        } catch (EventNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{eventId}")
    public Event updateEvent(
            @PathVariable Long eventId,
            @RequestBody Event updatedEvent,
            @AuthenticationPrincipal User organizer
    ) {
        return eventService.updateEvent(eventId, updatedEvent, organizer);
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchEvents(
            @RequestParam(required = false) String category,  //Accept category as a string
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime fromDate
    ) {
        try {
            //Convert category to enum
            EventCategory eventCategory = null;
            if (StringUtils.hasText(category)) {
                try {
                    eventCategory = EventCategory.valueOf(category.trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest()
                            .body("Invalid category. Valid values: " +
                                    Arrays.toString(EventCategory.values()));
                }
            }

            List<Event> events = eventService.searchEvents(
                    EventSearchRequest.of(eventCategory, fromDate)
            );
            return ResponseEntity.ok(events);
        }  catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error processing request: " + e.getMessage());
        }
    }
}
