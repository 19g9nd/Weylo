using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace weylo.user.api.DTOS
{
    public class SubcategoryDto
    {
        public string Value { get; set; } = string.Empty; // "italian_restaurant"
        public string Label { get; set; } = string.Empty; // "Italian"
        public int Count { get; set; }
    }
}