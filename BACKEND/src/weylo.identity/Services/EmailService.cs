using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using weylo.identity.Services.Interfaces;

namespace weylo.identity.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task SendVerificationEmailAsync(string email, string token)
        {
            var subject = "Verify Your Email Address";
            var verificationLink = $"{_configuration["App:ClientUrl"]}/verify-email?token={token}";

            var body = $@"
                <html>
                <body>
                    <h2>Email Verification</h2>
                    <p>Please click the link below to verify your email address:</p>
                    <p><a href='{verificationLink}' style='background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;'>Verify Email</a></p>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>{verificationLink}</p>
                    <p>This link will expire in 24 hours.</p>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string email, string token)
        {
            var subject = "Reset Your Password";
            var resetLink = $"{_configuration["App:ClientUrl"]}/reset-password?token={token}";

            var body = $@"
                <html>
                <body>
                    <h2>Password Reset</h2>
                    <p>You requested a password reset. Click the link below to reset your password:</p>
                    <p><a href='{resetLink}' style='background-color: #f44336; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;'>Reset Password</a></p>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p>{resetLink}</p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        private async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    _configuration["Email:SenderName"],
                    _configuration["Email:SenderEmail"]
                ));
                message.To.Add(new MailboxAddress("", to));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = body
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

                // Connect to SMTP server
                await client.ConnectAsync(
                    _configuration["Email:SmtpHost"],
                    int.Parse(_configuration["Email:SmtpPort"]),
                    SecureSocketOptions.StartTls
                );

                // Auth
                await client.AuthenticateAsync(
                    _configuration["Email:Username"],
                    _configuration["Email:Password"]
                );

                await client.SendAsync(message);
                await client.DisconnectAsync(true);
                _logger.LogInformation("Email sent successfully to {Email}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", to);
                throw new InvalidOperationException("Failed to send email", ex);
            }
        }
    }
}