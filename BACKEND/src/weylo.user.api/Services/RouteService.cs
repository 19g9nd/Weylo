using AutoMapper;
using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Data;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Services
{
    public class RouteService : IRouteService
    {
        private readonly UserDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IMapper _mapper;

        public RouteService(
            UserDbContext context,
            ICurrentUserService currentUserService,
            IMapper mapper)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mapper = mapper;
        }

        public async Task<RouteDto> CreateRouteAsync(CreateRouteRequest request)
        {
            var route = _mapper.Map<UserRoute>(request);
            route.CreatedAt = DateTime.UtcNow;
            route.UpdatedAt = DateTime.UtcNow;
            route.UserId = _currentUserService.UserId;

            await _context.UserRoutes.AddAsync(route);
            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDto>(route);
        }

        public async Task<RouteDestinationDto> AddDestinationToRouteAsync(int routeId, AddDestinationToRouteRequest request)
        {
            var userId = _currentUserService.UserId;

            // Проверяем существование маршрута
            var route = await _context.UserRoutes
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            // Находим или создаем UserDestination
            var userDestination = await _context.UserDestinations
                .Include(ud => ud.Destination)
                .FirstOrDefaultAsync(ud =>
                    ud.UserId == userId &&
                    ud.DestinationId == request.DestinationId);

            if (userDestination == null)
            {
                var destination = await _context.Destinations
                    .FirstOrDefaultAsync(d => d.Id == request.DestinationId);

                if (destination == null)
                    throw new BadHttpRequestException($"Destination with id {request.DestinationId} not found");

                userDestination = new UserDestination
                {
                    UserId = userId,
                    DestinationId = request.DestinationId,
                    SavedAt = DateTime.UtcNow
                };
                await _context.UserDestinations.AddAsync(userDestination);
                await _context.SaveChangesAsync();
            }

            var routeDay = await _context.RouteDays
                .FirstOrDefaultAsync(rd => rd.UserRouteId == routeId && rd.DayNumber == request.DayNumber);

            if (routeDay == null)
            {
                routeDay = new RouteDay
                {
                    UserRouteId = routeId,
                    DayNumber = request.DayNumber,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.RouteDays.AddAsync(routeDay);
                await _context.SaveChangesAsync();
            }

            var existingDestination = await _context.RouteDestinations
                .FirstOrDefaultAsync(rd => rd.RouteDayId == routeDay.Id && rd.UserDestinationId == userDestination.Id);

            if (existingDestination != null)
                throw new BadHttpRequestException($"Destination already exists in day {request.DayNumber}");

            var maxOrder = await _context.RouteDestinations
                .Where(rd => rd.RouteDayId == routeDay.Id)
                .MaxAsync(rd => (int?)rd.OrderInDay) ?? 0;

            var routeDestination = new RouteDestination
            {
                RouteDayId = routeDay.Id,
                UserDestinationId = userDestination.Id,
                OrderInDay = request.OrderInDay == 0 ? (maxOrder + 1) : request.OrderInDay,
                UserNotes = request.UserNotes,
                PlannedVisitDate = request.PlannedVisitDate,
                EstimatedDuration = request.EstimatedDuration,
                CreatedAt = DateTime.UtcNow
            };

            await _context.RouteDestinations.AddAsync(routeDestination);
            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _context.Entry(routeDestination)
                .Reference(rd => rd.UserDestination)
                .Query()
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.Category)
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .LoadAsync();

            return _mapper.Map<RouteDestinationDto>(routeDestination);
        }

        public async Task<RouteDetailsDto> GetRouteDetailsAsync(int routeId)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteDays.OrderBy(rd => rd.DayNumber))
                    .ThenInclude(rd => rd.RouteDestinations.OrderBy(rd => rd.OrderInDay))
                    .ThenInclude(rd => rd.UserDestination)
                    .ThenInclude(ud => ud.Destination)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RouteDays)
                    .ThenInclude(rd => rd.RouteDestinations.OrderBy(rd => rd.OrderInDay))
                    .ThenInclude(rd => rd.UserDestination)
                    .ThenInclude(ud => ud.Destination)
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            return _mapper.Map<RouteDetailsDto>(route);
        }

        public async Task<IEnumerable<RouteDto>> GetUserRoutesAsync()
        {
            var userId = _currentUserService.UserId;

            var routes = await _context.UserRoutes
                .Where(r => r.UserId == userId)
                .Include(r => r.RouteDays)
                    .ThenInclude(rd => rd.RouteDestinations)
                .OrderByDescending(r => r.UpdatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<RouteDto>>(routes);
        }

        public async Task<bool> DeleteRouteAsync(int routeId)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                return false;

            _context.UserRoutes.Remove(route);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveDestinationFromRouteAsync(int routeId, int destinationId)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                return false;

            var userDestination = await _context.UserDestinations
                .FirstOrDefaultAsync(ud => ud.UserId == userId && ud.DestinationId == destinationId);

            if (userDestination == null)
                return false;

            var routeDestination = await _context.RouteDestinations
                .Include(rd => rd.RouteDay)
                .FirstOrDefaultAsync(rd =>
                    rd.RouteDay.UserRouteId == routeId &&
                    rd.UserDestinationId == userDestination.Id);

            if (routeDestination == null)
                return false;

            var routeDayId = routeDestination.RouteDayId;
            var removedOrder = routeDestination.OrderInDay;

            _context.RouteDestinations.Remove(routeDestination);

            var remainingDestinations = await _context.RouteDestinations
                .Where(rd => rd.RouteDayId == routeDayId && rd.OrderInDay > removedOrder)
                .ToListAsync();

            foreach (var rd in remainingDestinations)
            {
                rd.OrderInDay--;
            }

            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReorderRouteDestinationsAsync(int routeId, List<int> destinationOrder)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteDays)
                    .ThenInclude(rd => rd.RouteDestinations)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                return false;

            var allRouteDestinationIds = route.RouteDays
                .SelectMany(rd => rd.RouteDestinations)
                .Select(rd => rd.Id)
                .ToHashSet();

            if (destinationOrder.Any(id => !allRouteDestinationIds.Contains(id)))
                return false;

            for (int i = 0; i < destinationOrder.Count; i++)
            {
                var routeDestination = route.RouteDays
                    .SelectMany(rd => rd.RouteDestinations)
                    .FirstOrDefault(rd => rd.Id == destinationOrder[i]);

                if (routeDestination != null)
                {
                    routeDestination.OrderInDay = i + 1;
                }
            }

            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<RouteDto> UpdateRouteAsync(int routeId, UpdateRouteRequest request)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteDays)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            if (!string.IsNullOrWhiteSpace(request.Name))
                route.Name = request.Name;

            if (request.StartDate.HasValue)
                route.StartDate = request.StartDate.Value;

            if (request.EndDate.HasValue)
                route.EndDate = request.EndDate.Value;

            if (request.Notes != null)
                route.Notes = request.Notes;

            if (!string.IsNullOrWhiteSpace(request.Status))
                route.Status = request.Status;

            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDto>(route);
        }

        public async Task<RouteDestinationDto> UpdateRouteDestinationAsync(int routeDestinationId, UpdateRouteDestinationRequest request)
        {
            var userId = _currentUserService.UserId;

            var routeDestination = await _context.RouteDestinations
                .Include(rd => rd.RouteDay)
                    .ThenInclude(rd => rd.UserRoute)
                .Include(rd => rd.UserDestination)
                    .ThenInclude(ud => ud.Destination)
                    .ThenInclude(d => d.Category)
                .Include(rd => rd.UserDestination)
                    .ThenInclude(ud => ud.Destination)
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(rd =>
                    rd.Id == routeDestinationId &&
                    rd.RouteDay.UserRoute.UserId == userId);

            if (routeDestination == null)
                throw new BadHttpRequestException($"Route destination with id {routeDestinationId} not found");

            if (request.OrderInDay.HasValue)
            {
                var oldOrder = routeDestination.OrderInDay;
                var newOrder = request.OrderInDay.Value;

                if (oldOrder != newOrder)
                {
                    var otherDestinations = await _context.RouteDestinations
                        .Where(rd => rd.RouteDayId == routeDestination.RouteDayId && rd.Id != routeDestinationId)
                        .ToListAsync();

                    if (newOrder < oldOrder)
                    {
                        foreach (var rd in otherDestinations.Where(rd => rd.OrderInDay >= newOrder && rd.OrderInDay < oldOrder))
                        {
                            rd.OrderInDay++;
                        }
                    }
                    else
                    {
                        foreach (var rd in otherDestinations.Where(rd => rd.OrderInDay > oldOrder && rd.OrderInDay <= newOrder))
                        {
                            rd.OrderInDay--;
                        }
                    }

                    routeDestination.OrderInDay = newOrder;
                }
            }

            if (request.PlannedVisitDate.HasValue)
                routeDestination.PlannedVisitDate = request.PlannedVisitDate.Value;

            if (!string.IsNullOrWhiteSpace(request.EstimatedDuration))
                routeDestination.EstimatedDuration = request.EstimatedDuration;

            if (request.UserNotes != null)
                routeDestination.UserNotes = request.UserNotes;

            if (request.IsVisited.HasValue)
            {
                routeDestination.IsVisited = request.IsVisited.Value;

                if (request.IsVisited.Value && !routeDestination.ActualVisitDate.HasValue)
                    routeDestination.ActualVisitDate = DateTime.UtcNow;
                else if (!request.IsVisited.Value)
                    routeDestination.ActualVisitDate = null;
            }

            if (request.ActualVisitDate.HasValue)
                routeDestination.ActualVisitDate = request.ActualVisitDate.Value;

            routeDestination.RouteDay.UserRoute.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDestinationDto>(routeDestination);
        }

        public async Task<RouteDayDto> AddDayToRouteAsync(int routeId, AddDayRequest request)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            var existingDay = await _context.RouteDays
                .FirstOrDefaultAsync(rd => rd.UserRouteId == routeId && rd.DayNumber == request.DayNumber);

            if (existingDay != null)
                throw new BadHttpRequestException($"Day {request.DayNumber} already exists in this route");

            var routeDay = new RouteDay
            {
                UserRouteId = routeId,
                DayNumber = request.DayNumber,
                Date = request.Date,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow
            };

            await _context.RouteDays.AddAsync(routeDay);
            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDayDto>(routeDay);
        }

        public async Task<RouteDayDto> UpdateDayAsync(int routeDayId, UpdateDayRequest request)
        {
            var userId = _currentUserService.UserId;

            var routeDay = await _context.RouteDays
                .Include(rd => rd.UserRoute)
                .FirstOrDefaultAsync(rd => rd.Id == routeDayId && rd.UserRoute.UserId == userId);

            if (routeDay == null)
                throw new BadHttpRequestException($"Route day with id {routeDayId} not found");

            if (request.Date.HasValue)
                routeDay.Date = request.Date.Value;

            if (request.Notes != null)
                routeDay.Notes = request.Notes;

            routeDay.UserRoute.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDayDto>(routeDay);
        }

        public async Task<RouteDestinationDto> MoveDestinationToDayAsync(int routeDestinationId, MoveDestinationRequest request)
        {
            var userId = _currentUserService.UserId;

            var routeDestination = await _context.RouteDestinations
                .Include(rd => rd.RouteDay)
                    .ThenInclude(rd => rd.UserRoute)
                .Include(rd => rd.UserDestination)
                    .ThenInclude(ud => ud.Destination)
                .FirstOrDefaultAsync(rd =>
                    rd.Id == routeDestinationId &&
                    rd.RouteDay.UserRoute.UserId == userId);

            if (routeDestination == null)
                throw new BadHttpRequestException($"Route destination with id {routeDestinationId} not found");

            var currentRouteDay = routeDestination.RouteDay;
            var routeId = currentRouteDay.UserRouteId;

            // Находим или создаем новый день
            var newRouteDay = await _context.RouteDays
                .FirstOrDefaultAsync(rd => rd.UserRouteId == routeId && rd.DayNumber == request.NewDayNumber);

            if (newRouteDay == null)
            {
                newRouteDay = new RouteDay
                {
                    UserRouteId = routeId,
                    DayNumber = request.NewDayNumber,
                    CreatedAt = DateTime.UtcNow
                };
                await _context.RouteDays.AddAsync(newRouteDay);
                await _context.SaveChangesAsync();
            }

            // Обновляем порядок в старом дне
            var oldDayDestinations = await _context.RouteDestinations
                .Where(rd => rd.RouteDayId == currentRouteDay.Id && rd.OrderInDay > routeDestination.OrderInDay)
                .ToListAsync();

            foreach (var rd in oldDayDestinations)
            {
                rd.OrderInDay--;
            }

            // Определяем порядок в новом дне
            var maxOrderInNewDay = await _context.RouteDestinations
                .Where(rd => rd.RouteDayId == newRouteDay.Id)
                .MaxAsync(rd => (int?)rd.OrderInDay) ?? 0;

            // Перемещаем место
            routeDestination.RouteDayId = newRouteDay.Id;
            routeDestination.OrderInDay = request.NewOrderInDay == 0 ? (maxOrderInNewDay + 1) : request.NewOrderInDay;

            // Обновляем порядок в новом дне если нужно
            if (request.NewOrderInDay > 0)
            {
                var newDayDestinations = await _context.RouteDestinations
                    .Where(rd => rd.RouteDayId == newRouteDay.Id && rd.OrderInDay >= routeDestination.OrderInDay && rd.Id != routeDestination.Id)
                    .ToListAsync();

                foreach (var rd in newDayDestinations)
                {
                    rd.OrderInDay++;
                }
            }

            currentRouteDay.UserRoute.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _context.Entry(routeDestination)
                .Reference(rd => rd.UserDestination)
                .Query()
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.Category)
                .Include(ud => ud.Destination)
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .LoadAsync();

            return _mapper.Map<RouteDestinationDto>(routeDestination);
        }
        public async Task<bool> RemoveDayFromRouteAsync(int routeId, int dayNumber)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                return false;

            var routeDay = await _context.RouteDays
                .Include(rd => rd.RouteDestinations)
                .FirstOrDefaultAsync(rd => rd.UserRouteId == routeId && rd.DayNumber == dayNumber);

            if (routeDay == null)
                return false;

            if (routeDay.RouteDestinations.Any())
            {
                // Можно либо запретить удаление, либо переместить места в другой день
                // Сейчас просто запрет на удаление дней с местами
                return false;
            }

            _context.RouteDays.Remove(routeDay);
            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}