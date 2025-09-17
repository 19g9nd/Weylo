namespace weylo.admin.api.Models
{
    public class OperationResult
    {
        public bool IsSuccess { get; private set; }
        public string? Message { get; private set; }
        public string? ErrorMessage { get; private set; }

        private OperationResult(bool isSuccess, string? message = null, string? errorMessage = null)
        {
            IsSuccess = isSuccess;
            Message = message;
            ErrorMessage = errorMessage;
        }

        public static OperationResult Success(string? message = null) => new(true, message);
        public static OperationResult Failure(string errorMessage) => new(false, null, errorMessage);
    }
}