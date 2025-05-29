package com.eventms.eventms.repository;

import com.eventms.eventms.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByAttendeeId(Long attendeeId);
    Optional<Booking> findByEventIdAndAttendeeIdAndCancelledFalse(Long eventId, Long userId);
    Optional<Booking> findByEventIdAndAttendeeId(Long eventId, Long attendeeId);
    int countByEventIdAndIsCancelledFalse(Long eventId);
    Optional<Booking> findByIdAndAttendeeId(Long bookingId, Long attendeeId);
}