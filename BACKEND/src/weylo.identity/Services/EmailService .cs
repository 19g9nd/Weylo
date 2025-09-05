using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

            await Task.CompletedTask;
        }

        public async Task SendPasswordResetEmailAsync(string email, string token)
        {

            await Task.CompletedTask;
        }
        //TODO: Implement actual email sending logic 
    }
}