using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace weylo.shared.Converters
{
    /// <summary>
    /// JSON converter for TimeOnly? (nullable)
    /// </summary>
    public class NullableTimeOnlyJsonConverter : JsonConverter<TimeOnly?>
    {
        private const string Format = "HH:mm";

        public override TimeOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            var value = reader.GetString();

            if (string.IsNullOrWhiteSpace(value))
                return null;

            // Try parsing with strict format first
            if (TimeOnly.TryParseExact(value, Format, null, System.Globalization.DateTimeStyles.None, out var time))
                return time;

            // Fallback to general parsing (handles "HH:mm:ss" etc.)
            if (TimeOnly.TryParse(value, out time))
                return time;

            throw new JsonException($"Unable to parse '{value}' as TimeOnly");
        }

        public override void Write(Utf8JsonWriter writer, TimeOnly? value, JsonSerializerOptions options)
        {
            if (value.HasValue)
                writer.WriteStringValue(value.Value.ToString(Format));
            else
                writer.WriteNullValue();
        }
    }
}