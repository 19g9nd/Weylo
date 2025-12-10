using System.Text.Json;
using System.Text.Json.Serialization;

namespace weylo.shared.Converters
{
    namespace weylo.shared.Converters
    {
        /// <summary>
        /// JSON converter for TimeOnly (non-nullable)
        /// </summary>
        public class TimeOnlyJsonConverter : JsonConverter<TimeOnly>
        {
            private const string Format = "HH:mm";

            public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            {
                var value = reader.GetString();

                if (string.IsNullOrWhiteSpace(value))
                    return default;

                // Try parsing with strict format first
                if (TimeOnly.TryParseExact(value, Format, null, System.Globalization.DateTimeStyles.None, out var time))
                    return time;

                // Fallback to general parsing (handles "HH:mm:ss" etc.)
                if (TimeOnly.TryParse(value, out time))
                    return time;

                throw new JsonException($"Unable to parse '{value}' as TimeOnly");
            }

            public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
            {
                writer.WriteStringValue(value.ToString(Format));
            }
        }
    }
}