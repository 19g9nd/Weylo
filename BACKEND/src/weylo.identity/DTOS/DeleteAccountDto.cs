using System.ComponentModel.DataAnnotations;

namespace weylo.identity.DTOS
{
    public class DeleteAccountDto
    {
        [Required(ErrorMessage = "Password is required")]
        public string Password { get; set; } = string.Empty;
    }
}