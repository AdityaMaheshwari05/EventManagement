package com.eventms.eventms.service;

import com.eventms.eventms.entity.Booking;
import com.eventms.eventms.entity.Event;
import com.eventms.eventms.entity.User;
import com.eventms.eventms.exception.AccessDeniedException;
import com.eventms.eventms.exception.BookingNotFoundException;
import com.eventms.eventms.exception.EventNotFoundException;
import com.eventms.eventms.repository.BookingRepository;
import com.eventms.eventms.repository.EventRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import com.eventms.eventms.exception.NoAvailableSlotsException;
import com.eventms.eventms.exception.DuplicateBookingException;


@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final EmailService emailService;

    public BookingService(BookingRepository bookingRepository, EventRepository eventRepository, EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.emailService = emailService;
    }

    public Booking createBooking(Long eventId, User attendee) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found"));

        if (event.getAvailableSlots() <= 0) {
            throw new NoAvailableSlotsException("No available slots for this event.");
        }

        if (bookingRepository.findByEventIdAndAttendeeId(eventId, attendee.getId()).isPresent()) {
            throw new DuplicateBookingException("You have already booked this event.");
        }

        if (event.isCancelled()) {
            throw new IllegalStateException("Cannot book a cancelled event");
        }

        Booking booking = new Booking();
        booking.setEvent(event);
        booking.setAttendee(attendee);
        booking.setCancelled(false);

        // Reduce available slots
        event.setAvailableSlots(event.getAvailableSlots() - 1);
        eventRepository.save(event);
        Booking savedBooking = bookingRepository.save(booking);

        // Send booking confirmation email
        emailService.sendBookingConfirmation(
                attendee.getEmail(),
                event.getTitle()
        );

        return savedBooking;
    }

    public List<Booking> getUserBookings(Long userId) {
        return bookingRepository.findByAttendeeId(userId);
    }

    public void cancelBooking(Long bookingId, User attendee) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found"));

        if (!booking.getAttendee().getId().equals(attendee.getId())) {
            throw new AccessDeniedException("You can only cancel your own bookings.");
        }

        // Mark booking as cancelled
        booking.setCancelled(true);
        bookingRepository.save(booking);

        // Free up a slot
        Event event = booking.getEvent();
        event.setAvailableSlots(event.getAvailableSlots() + 1);
        eventRepository.save(event);

        // Send cancellation email
        emailService.sendCancellationNotice(
                attendee.getEmail(),
                event.getTitle()
        );
    }

    public Booking findActiveBookingByEvent(Long eventId, Long userId) {
        return bookingRepository.findByEventIdAndAttendeeIdAndCancelledFalse(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Active booking not found"));
    }
}
