using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace weylo.user.api.Requests
{
    public class DestinationFilterRequest
    {
        public int? CategoryId { get; set; }
        public int? CityId { get; set; }
        /// <summary>
        /// Filter by subcategories (e.g., ["italian_restaurant", "japanese_restaurant"])
        /// </summary>
        public string[]? Subcategories { get; set; }
        public double? MinRating { get; set; }
        public int? MaxPriceLevel { get; set; }
        public bool? WheelchairAccessible { get; set; }
        public bool? Takeout { get; set; }
        public bool? Delivery { get; set; }
        public int Take { get; set; } = 50;
    }
}