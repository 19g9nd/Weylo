namespace weylo.admin.api.DTOS
{
    public class AutoDetectCityRequest
    {

        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public bool AutoCreate { get; set; } = false; // If true, creates city automatically
    }
}