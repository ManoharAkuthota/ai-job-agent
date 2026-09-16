package com.jobagent.service;

import com.jobagent.model.AgentLog;
import com.jobagent.repository.AgentLogRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailNotificationService {

    private final AgentLogRepository logRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailNotificationService(AgentLogRepository logRepository) {
        this.logRepository = logRepository;
    }

    public boolean sendApplicationSubmittedEmail(String toEmail, String jobTitle, String company,
                                                 String appliedMethod, String proofScreenshotPath) {
        if (toEmail == null || toEmail.isBlank()) {
            return false;
        }

        String subject = "🚀 Application Submitted: " + jobTitle + " at " + company;
        String timeNow = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss"));

        String htmlContent = """
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #030712; color: #f9fafb; padding: 28px; border-radius: 12px; border: 1px solid #1f2937;">
                <div style="border-bottom: 1px solid #1f2937; padding-bottom: 16px; margin-bottom: 20px;">
                    <span style="background: linear-gradient(135deg, #6366f1, #a855f7); color: #ffffff; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">Autonomous Bot Alert</span>
                    <h2 style="margin: 12px 0 4px; font-size: 22px; color: #ffffff;">Job Application Dispatched</h2>
                    <p style="margin: 0; color: #9ca3af; font-size: 14px;">Your AI agent has autonomously submitted an application.</p>
                </div>

                <div style="background-color: #0f172a; border-radius: 8px; padding: 18px; margin-bottom: 20px; border: 1px solid #1e293b;">
                    <div style="margin-bottom: 10px;">
                        <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: 600;">Role & Company</span>
                        <div style="font-size: 16px; font-weight: 600; color: #38bdf8;">%s @ %s</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: 600;">Submission Method</span>
                        <div style="font-size: 14px; color: #e2e8f0;">%s</div>
                    </div>
                    <div>
                        <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; font-weight: 600;">Timestamp</span>
                        <div style="font-size: 14px; color: #e2e8f0;">%s</div>
                    </div>
                </div>

                <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
                    A custom-tailored ATS-compliant resume was compiled and submitted. Full application tracking and proof screenshots are available in your Portfolio Killer dashboard.
                </p>
                <div style="border-top: 1px solid #1f2937; padding-top: 16px; margin-top: 24px; text-align: center; color: #6b7280; font-size: 12px;">
                    Sent automatically by AI Job Application Bot • Next-Gen Autonomous Career Agent
                </div>
            </div>
            """.formatted(jobTitle, company, appliedMethod, timeNow);

        return sendEmailOrLog(toEmail, subject, htmlContent, proofScreenshotPath);
    }

    public boolean sendHighMatchJobAlert(String toEmail, String jobTitle, String company,
                                         int matchScore, String jobUrl) {
        if (toEmail == null || toEmail.isBlank()) {
            return false;
        }

        String subject = "🎯 High Match Alert (" + matchScore + "%): " + jobTitle + " at " + company;

        String htmlContent = """
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #030712; color: #f9fafb; padding: 28px; border-radius: 12px; border: 1px solid #1f2937;">
                <div style="border-bottom: 1px solid #1f2937; padding-bottom: 16px; margin-bottom: 20px;">
                    <span style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">%d%% ATS Match</span>
                    <h2 style="margin: 12px 0 4px; font-size: 22px; color: #ffffff;">High-Score Opportunity Discovered</h2>
                    <p style="margin: 0; color: #9ca3af; font-size: 14px;">A role matching your verified skills was detected.</p>
                </div>

                <div style="background-color: #0f172a; border-radius: 8px; padding: 18px; margin-bottom: 20px; border: 1px solid #1e293b;">
                    <div style="font-size: 18px; font-weight: 600; color: #38bdf8; margin-bottom: 6px;">%s</div>
                    <div style="font-size: 15px; color: #e2e8f0; margin-bottom: 16px;">%s</div>
                    <a href="%s" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View Official Career Portal</a>
                </div>

                <div style="border-top: 1px solid #1f2937; padding-top: 16px; margin-top: 24px; text-align: center; color: #6b7280; font-size: 12px;">
                    AI Job Application Bot • Autonomous Job Discovery Engine
                </div>
            </div>
            """.formatted(matchScore, jobTitle, company, (jobUrl != null ? jobUrl : "#"));

        return sendEmailOrLog(toEmail, subject, htmlContent, null);
    }

    public boolean sendTestEmail(String toEmail) {
        if (toEmail == null || toEmail.isBlank()) {
            return false;
        }

        String subject = "🔔 Test Email from AI Job Application Bot";
        String htmlContent = """
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #030712; color: #f9fafb; padding: 28px; border-radius: 12px; border: 1px solid #1f2937;">
                <h2 style="margin: 0 0 12px; font-size: 20px; color: #10b981;">✅ Email Notifications Verified!</h2>
                <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
                    Your AI Job Application Bot email notification pipeline is configured and functioning correctly. You will receive automated alerts when the bot discovers high-match jobs and submits autonomous applications.
                </p>
                <div style="margin-top: 20px; color: #6b7280; font-size: 12px;">Timestamp: %s</div>
            </div>
            """.formatted(LocalDateTime.now().toString());

        return sendEmailOrLog(toEmail, subject, htmlContent, null);
    }

    private boolean sendEmailOrLog(String toEmail, String subject, String htmlContent, String attachmentPath) {
        if (mailSender != null && fromEmail != null && !fromEmail.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail);
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);

                if (attachmentPath != null) {
                    File file = new File(attachmentPath);
                    if (file.exists()) {
                        helper.addAttachment(file.getName(), file);
                    }
                }

                mailSender.send(message);
                logRepository.save(new AgentLog("SUCCESS", "EMAIL", "Sent email to " + toEmail + " | Subject: " + subject));
                return true;
            } catch (Exception e) {
                logRepository.save(new AgentLog("WARN", "EMAIL", "SMTP send failed (" + e.getMessage() + "). Saved notification to logs."));
                return false;
            }
        } else {
            // Simulated/mock email dispatch mode when SMTP credentials are not configured
            logRepository.save(new AgentLog("INFO", "EMAIL_SIMULATED",
                    "Email notification simulated for: " + toEmail + " | Subject: " + subject + " (Configure spring.mail.username in application.properties for real SMTP dispatch)."));
            return true;
        }
    }
}
