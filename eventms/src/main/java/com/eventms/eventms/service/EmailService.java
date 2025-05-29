package com.eventms.eventms.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${notification.sender}")
    private String senderEmail;

    @Value("${notification.booking-confirmation-subject}")
    private String confirmationSubject;

    @Value("${notification.booking-cancellation-subject}")
    private String cancellationSubject;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendBookingConfirmation(String recipientEmail, String eventTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(recipientEmail);
        message.setSubject(confirmationSubject);
        message.setText(String.format(
                "Your booking for '%s' is confirmed!\n\n" +
                        "Event Details:\n" +
                        "- Title: %s\n" +
                        "- Manage your bookings at: http://yourapp.com/my-bookings",
                eventTitle, eventTitle
        ));
        mailSender.send(message);
    }

    public void sendCancellationNotice(String recipientEmail, String eventTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(senderEmail);
        message.setTo(recipientEmail);
        message.setSubject(cancellationSubject);
        message.setText(String.format(
                "Your booking for '%s' has been cancelled.\n\n" +
                        "A slot has been freed up for others to book.\n" +
                        "View other events: http://yourapp.com/events",
                eventTitle
        ));
        mailSender.send(message);
    }
}
