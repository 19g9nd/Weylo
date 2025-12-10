using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace weylo.admin.api.DTOS
{
    public class CityGeocodingResult
    {
        public string PlaceId { get; set; } = string.Empty;
        public string CityName { get; set; } = string.Empty;
        public string CountryName { get; set; } = string.Empty;
        public string CountryCode { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string FormattedAddress { get; set; } = string.Empty;
    }
}