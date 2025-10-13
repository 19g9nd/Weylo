using AutoMapper;
using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Controllers.Data;
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

            // Проверяем существование места
            var destination = await _context.Destinations
                .FirstOrDefaultAsync(d => d.Id == request.DestinationId);

            if (destination == null)
                throw new BadHttpRequestException($"Destination with id {request.DestinationId} not found");

            // Проверяем, не добавлено ли уже это место
            var existingDestination = await _context.RouteDestinations
                .FirstOrDefaultAsync(rd => rd.UserRouteId == routeId && rd.DestinationId == request.DestinationId);

            if (existingDestination != null)
                throw new BadHttpRequestException($"Destination already exists in this route");

            var maxOrder = await _context.RouteDestinations
                .Where(rd => rd.UserRouteId == routeId)
                .MaxAsync(rd => (int?)rd.Order) ?? 0;

            var routeDestination = _mapper.Map<RouteDestination>(request);
            routeDestination.UserRouteId = routeId;
            routeDestination.Order = request.Order == 0 ? (maxOrder + 1) : request.Order;
            routeDestination.CreatedAt = DateTime.UtcNow;

            await _context.RouteDestinations.AddAsync(routeDestination);

            route.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _context.Entry(routeDestination)
                .Reference(rd => rd.Destination)
                .Query()
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .LoadAsync();

            return _mapper.Map<RouteDestinationDto>(routeDestination);
        }

        public async Task<RouteDetailsDto> GetRouteDetailsAsync(int routeId)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteDestinations.OrderBy(rd => rd.Order))
                    .ThenInclude(rd => rd.Destination)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RouteDestinations)
                    .ThenInclude(rd => rd.Destination)
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
                .Include(r => r.RouteDestinations)
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

            // RouteDestinations удалятся автоматически благодаря Cascade
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

            var routeDestination = await _context.RouteDestinations
                .FirstOrDefaultAsync(rd => rd.UserRouteId == routeId && rd.DestinationId == destinationId);

            if (routeDestination == null)
                return false;

            var removedOrder = routeDestination.Order;

            _context.RouteDestinations.Remove(routeDestination);

            var remainingDestinations = await _context.RouteDestinations
                .Where(rd => rd.UserRouteId == routeId && rd.Order > removedOrder)
                .ToListAsync();

            foreach (var rd in remainingDestinations)
            {
                rd.Order--;
            }

            route.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReorderRouteDestinationsAsync(int routeId, List<int> destinationOrder)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteDestinations)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                return false;

            var routeDestinationIds = route.RouteDestinations.Select(rd => rd.DestinationId).ToHashSet();
            if (destinationOrder.Any(id => !routeDestinationIds.Contains(id)))
                return false;

            for (int i = 0; i < destinationOrder.Count; i++)
            {
                var destination = route.RouteDestinations
                    .FirstOrDefault(rd => rd.DestinationId == destinationOrder[i]);

                if (destination != null)
                {
                    destination.Order = i + 1;
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
                .Include(r => r.RouteDestinations)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            if (!string.IsNullOrWhiteSpace(request.Name))
                route.Name = request.Name;

            if (request.StartDate.HasValue)
                route.StartDate = request.StartDate.Value;

            if (request.EndDate.HasValue)
                route.EndDate = request.EndDate.Value;

            if (request.Notes != null) // Даже пустую строку можно установить
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
                .Include(rd => rd.UserRoute)
                .Include(rd => rd.Destination)
                    .ThenInclude(d => d.Category)
                .Include(rd => rd.Destination)
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(rd => rd.Id == routeDestinationId && rd.UserRoute.UserId == userId);

            if (routeDestination == null)
                throw new BadHttpRequestException($"Route destination with id {routeDestinationId} not found");

            if (request.Order.HasValue)
            {
                var oldOrder = routeDestination.Order;
                var newOrder = request.Order.Value;

                if (oldOrder != newOrder)
                {
                    var otherDestinations = await _context.RouteDestinations
                        .Where(rd => rd.UserRouteId == routeDestination.UserRouteId && rd.Id != routeDestinationId)
                        .ToListAsync();

                    if (newOrder < oldOrder)
                    {
                        foreach (var rd in otherDestinations.Where(rd => rd.Order >= newOrder && rd.Order < oldOrder))
                        {
                            rd.Order++;
                        }
                    }
                    else
                    {
                        foreach (var rd in otherDestinations.Where(rd => rd.Order > oldOrder && rd.Order <= newOrder))
                        {
                            rd.Order--;
                        }
                    }

                    routeDestination.Order = newOrder;
                }
            }

            if (request.PlannedVisitDate.HasValue)
                routeDestination.PlannedVisitDate = request.PlannedVisitDate.Value;

            if (request.EstimatedDuration.HasValue)
                routeDestination.EstimatedDuration = request.EstimatedDuration.Value;

            if (request.UserNotes != null)
                routeDestination.UserNotes = request.UserNotes;

            if (request.IsVisited.HasValue)
            {
                routeDestination.IsVisited = request.IsVisited.Value;

                // Автоматически устанавливаем дату посещения
                if (request.IsVisited.Value && !routeDestination.ActualVisitDate.HasValue)
                    routeDestination.ActualVisitDate = DateTime.UtcNow;
                else if (!request.IsVisited.Value)
                    routeDestination.ActualVisitDate = null;
            }

            if (request.ActualVisitDate.HasValue)
                routeDestination.ActualVisitDate = request.ActualVisitDate.Value;

            // Обновляем дату изменения маршрута
            routeDestination.UserRoute.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDestinationDto>(routeDestination);
        }

        public async Task<RouteStatisticsDto> GetRouteStatisticsAsync(int routeId)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteDestinations)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            var statistics = new RouteStatisticsDto
            {
                TotalDestinations = route.RouteDestinations.Count,
                VisitedDestinations = route.RouteDestinations.Count(rd => rd.IsVisited),
                PlannedDestinations = route.RouteDestinations.Count(rd => !rd.IsVisited),
                TotalEstimatedDuration = route.RouteDestinations
                    .Where(rd => rd.EstimatedDuration.HasValue)
                    .Sum(rd => rd.EstimatedDuration!.Value.TotalMinutes),
                DaysUntilStart = route.StartDate > DateTime.UtcNow
                    ? (int)(route.StartDate - DateTime.UtcNow).TotalDays
                    : 0,
                TripDuration = (int)(route.EndDate - route.StartDate).TotalDays + 1
            };

            return statistics;
        }

        public async Task<RouteDto> DuplicateRouteAsync(int routeId)
        {
            var userId = _currentUserService.UserId;

            var originalRoute = await _context.UserRoutes
                .Include(r => r.RouteDestinations)
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (originalRoute == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            var newRoute = new UserRoute
            {
                Name = $"{originalRoute.Name} (Copy)",
                UserId = userId,
                StartDate = originalRoute.StartDate,
                EndDate = originalRoute.EndDate,
                Notes = originalRoute.Notes,
                Status = "Draft",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.UserRoutes.AddAsync(newRoute);
            await _context.SaveChangesAsync();

            foreach (var rd in originalRoute.RouteDestinations.OrderBy(rd => rd.Order))
            {
                var newRouteDestination = new RouteDestination
                {
                    UserRouteId = newRoute.Id,
                    DestinationId = rd.DestinationId,
                    Order = rd.Order,
                    PlannedVisitDate = rd.PlannedVisitDate,
                    EstimatedDuration = rd.EstimatedDuration,
                    UserNotes = rd.UserNotes,
                    IsVisited = false,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.RouteDestinations.AddAsync(newRouteDestination);
            }

            await _context.SaveChangesAsync();

            newRoute = await _context.UserRoutes
                .Include(r => r.RouteDestinations)
                .FirstAsync(r => r.Id == newRoute.Id);

            return _mapper.Map<RouteDto>(newRoute);
        }
    }

    public class RouteStatisticsDto
    {
        public int TotalDestinations { get; set; }
        public int VisitedDestinations { get; set; }
        public int PlannedDestinations { get; set; }
        public double TotalEstimatedDuration { get; set; } // в минутах
        public int DaysUntilStart { get; set; }
        public int TripDuration { get; set; } // в днях
    }
}