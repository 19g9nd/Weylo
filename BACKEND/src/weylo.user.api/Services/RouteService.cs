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

            var route = await _context.UserRoutes
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            var destination = await _context.Destinations
                .FirstOrDefaultAsync(d => d.Id == request.DestinationId);

            if (destination == null)
                throw new BadHttpRequestException($"Destination with id {request.DestinationId} not found");

            var existingDestination = await _context.RouteDestinations
                .FirstOrDefaultAsync(rd => rd.UserRouteId == routeId && rd.DestinationId == request.DestinationId);

            if (existingDestination != null)
                throw new BadHttpRequestException($"Destination already exists in this route");

            var routeDestination = _mapper.Map<RouteDestination>(request);
            routeDestination.UserRouteId = routeId;
            routeDestination.CreatedAt = DateTime.UtcNow;

            await _context.RouteDestinations.AddAsync(routeDestination);
            await _context.SaveChangesAsync();

            await _context.Entry(routeDestination)
                .Reference(rd => rd.Destination)
                .Query()
                .Include(d => d.Category)
                .Include(d => d.City)
                .LoadAsync();

            return _mapper.Map<RouteDestinationDto>(routeDestination);
        }

        public async Task<RouteDetailsDto> GetRouteDetailsAsync(int routeId)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteDestinations)
                    .ThenInclude(rd => rd.Destination)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RouteDestinations)
                    .ThenInclude(rd => rd.Destination)
                    .ThenInclude(d => d.City)
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

            _context.RouteDestinations.Remove(routeDestination);
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

            foreach (var destination in route.RouteDestinations)
            {
                var newOrder = destinationOrder.IndexOf(destination.DestinationId);
                if (newOrder != -1)
                {
                    destination.Order = newOrder + 1; // +1 если порядок начинается с 1
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
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
                throw new BadHttpRequestException($"Route with id {routeId} not found");

            if (!string.IsNullOrEmpty(request.Name))
                route.Name = request.Name;

            if (request.StartDate.HasValue)
                route.StartDate = request.StartDate.Value;

            if (request.EndDate.HasValue)
                route.EndDate = request.EndDate.Value;

            if (!string.IsNullOrEmpty(request.Notes))
                route.Notes = request.Notes;

            if (!string.IsNullOrEmpty(request.Status))
                route.Status = request.Status;

            route.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDto>(route);
        }

        public async Task<RouteDestinationDto> UpdateRouteDestinationAsync(int routeDestinationId, UpdateRouteDestinationRequest request)
        {
            var routeDestination = await _context.RouteDestinations
                .Include(rd => rd.UserRoute)
                .Include(rd => rd.Destination)
                    .ThenInclude(d => d.Category)
                .Include(rd => rd.Destination)
                    .ThenInclude(d => d.City)
                .FirstOrDefaultAsync(rd => rd.Id == routeDestinationId && rd.UserRoute.UserId == _currentUserService.UserId);

            if (routeDestination == null)
                throw new BadHttpRequestException($"Route destination with id {routeDestinationId} not found");

            if (request.Order.HasValue)
                routeDestination.Order = request.Order.Value;

            if (request.PlannedVisitDate.HasValue)
                routeDestination.PlannedVisitDate = request.PlannedVisitDate.Value;

            if (request.EstimatedDuration.HasValue)
                routeDestination.EstimatedDuration = request.EstimatedDuration.Value;

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

            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDestinationDto>(routeDestination);
        }
    }
}