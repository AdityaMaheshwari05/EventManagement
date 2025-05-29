package com.eventms.eventms.controller;

import com.eventms.eventms.entity.Booking;
import com.eventms.eventms.entity.User;
import com.eventms.eventms.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = { "http://localhost:5500", "http://127.0.0.1:5500" }, allowCredentials = "true")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping("/{eventId}")
    public ResponseEntity<String> bookEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal User attendee
    ) {
        bookingService.createBooking(eventId, attendee);
        return ResponseEntity.ok("Booking confirmed!");
    }
    @GetMapping("/my-bookings")
    public List<Booking> getMyBookings(@AuthenticationPrincipal User attendee) {
        return bookingService.getUserBookings(attendee.getId());
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal User attendee
    ) {
        try {
            bookingService.cancelBooking(bookingId, attendee);
            return ResponseEntity.ok().body(Collections.singletonMap("message", "Booking cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    @GetMapping("/by-event/{eventId}")
    public ResponseEntity<Booking> getBookingByEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal User attendee
    ) {
        try {
            Booking booking = bookingService.findActiveBookingByEvent(eventId, attendee.getId());
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}