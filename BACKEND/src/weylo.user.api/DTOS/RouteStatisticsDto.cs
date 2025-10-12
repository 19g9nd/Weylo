using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace weylo.user.api.DTOS
{
    public class RouteStatisticsDto
    {
        public int TotalDestinations { get; set; }
        public int VisitedDestinations { get; set; }
        public int PlannedDestinations { get; set; }
        public double TotalEstimatedDuration { get; set; } // in minutes
        public int DaysUntilStart { get; set; }
        public int TripDuration { get; set; } // in days
        public double CompletionPercentage => TotalDestinations > 0
            ? (double)VisitedDestinations / TotalDestinations * 100
            : 0;
    }
}