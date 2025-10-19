namespace weylo.user.api.DTOS
{
    public class SavePlaceRequest
    {
        // Основные данные
        public string GooglePlaceId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
        public string[]? GoogleTypes { get; set; }


        // Кэшируемые данные
        public decimal? Rating { get; set; }
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }

        // Локация
        public string CityName { get; set; } = string.Empty;
        public string CountryName { get; set; } = string.Empty;

        // ✨ НОВЫЕ ПОЛЯ для фильтров (из Google Places API)

        // Общие атрибуты
        public int? PriceLevel { get; set; } // 0-4 (Free to Very Expensive)
        public string? OpeningHours { get; set; } // "Mon-Fri: 9am-5pm"
        public string? Phone { get; set; }
        public string? Website { get; set; }
        public bool? WheelchairAccessible { get; set; }

        // Для ресторанов
        public bool? Takeout { get; set; }
        public bool? Delivery { get; set; }
        public bool? DineIn { get; set; }
        public bool? Reservable { get; set; }
        public bool? ServesBeer { get; set; }
        public bool? ServesWine { get; set; }
        public bool? ServesBreakfast { get; set; }
        public bool? ServesLunch { get; set; }
        public bool? ServesDinner { get; set; }
        public bool? ServesVegetarian { get; set; }

        // Для отелей
        public int? StarRating { get; set; }
        public bool? FreeWifi { get; set; }
        public bool? Pool { get; set; }
        public bool? Parking { get; set; }

        // Дополнительные данные
        public string? UserRatingsTotal { get; set; } // Количество отзывов
        public string? EditorialSummary { get; set; }
    }
}