package com.eventms.eventms.repository;

import com.eventms.eventms.dto.EventSearchRequest;
import com.eventms.eventms.entity.Event;
import com.eventms.eventms.entity.EventCategory;
import com.eventms.eventms.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {
    @EntityGraph(attributePaths = {"organizer"})
    List<Event> findByOrganizerId(Long organizerId);

    @Query("SELECT e FROM Event e WHERE e.id = :id AND e.organizer = :organizer")
    Optional<Event> findByIdAndOrganizer(Long id, User organizer);
    List<Event> findByIsCancelledFalse();

    @Query("SELECT e FROM Event e WHERE e.isCancelled = false AND e.dateTime > CURRENT_TIMESTAMP")
    List<Event> findUpcomingEvents();

    @Query("SELECT e FROM Event e WHERE e.isCancelled = false AND e.dateTime <= CURRENT_TIMESTAMP")
    List<Event> findPastEvents();

    @Query("SELECT e FROM Event e WHERE e.isCancelled = true")
    List<Event> findCancelledEvents();

    List<Event> findByAvailableSlots(int slots);
    List<Event> findByCategoryAndDateTimeAfter(
            EventCategory category,
            LocalDateTime fromDate
    );

    @Query("SELECT e FROM Event e WHERE " +
            "(COALESCE(:category, NULL) IS NULL OR e.category = :category) AND " +
            "(COALESCE(:fromDate, NULL) IS NULL OR e.dateTime >= :fromDate) AND " +
            "e.isCancelled = false")
    List<Event> searchEvents(
            @Param("category") EventCategory category,
            @Param("fromDate") LocalDateTime fromDate
    );

}
