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
        private readonly ILogger<RouteService> _logger;

        public RouteService(
            UserDbContext context,
            ICurrentUserService currentUserService,
            IMapper mapper, ILogger<RouteService> logger)
        {
            _context = context;
            _currentUserService = currentUserService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<RouteDto> CreateRouteAsync(CreateRouteRequest request)
        {
            var route = _mapper.Map<UserRoute>(request);
            route.UserId = _currentUserService.UserId;
            route.CreatedAt = DateTime.UtcNow;
            route.UpdatedAt = DateTime.UtcNow;

            await _context.UserRoutes.AddAsync(route);
            await _context.SaveChangesAsync();

            return _mapper.Map<RouteDto>(route);
        }

        public async Task<RouteItemDto> AddDestinationToRouteAsync(int routeId, AddDestinationToRouteRequest request)
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

            // Определяем порядок в дне
            var maxOrder = await _context.RouteItems
                .Where(ri => ri.RouteId == routeId && ri.DayNumber == request.DayNumber)
                .MaxAsync(ri => (int?)ri.OrderInDay) ?? 0;

            var routeItem = new RouteItem
            {
                RouteId = routeId,
                DestinationId = request.DestinationId,
                DayNumber = request.DayNumber,
                OrderInDay = request.OrderInDay == 0 ? (maxOrder + 1) : request.OrderInDay,
                UserNotes = request.UserNotes,
                PlannedTime = request.PlannedTime,
            };

            await _context.RouteItems.AddAsync(routeItem);
            route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Загружаем связанные данные
            await _context.Entry(routeItem)
                .Reference(ri => ri.Destination)
                .Query()
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .LoadAsync();

            return _mapper.Map<RouteItemDto>(routeItem);
        }

        public async Task<RouteDetailsDto> GetRouteDetailsAsync(int routeId)
        {
            var userId = _currentUserService.UserId;

            var route = await _context.UserRoutes
                .Include(r => r.RouteItems.OrderBy(ri => ri.DayNumber).ThenBy(ri => ri.OrderInDay))
                    .ThenInclude(ri => ri.Destination)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RouteItems)
                    .ThenInclude(ri => ri.Destination)
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
                .Include(r => r.RouteItems)
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

        public async Task<bool> RemoveDestinationFromRouteAsync(int routeId, int routeItemId)
        {
            var userId = _currentUserService.UserId;

            // Get the specific route item by its ID
            var routeItem = await _context.RouteItems
                .Include(ri => ri.Route)
                .FirstOrDefaultAsync(ri =>
                    ri.Id == routeItemId &&
                    ri.RouteId == routeId &&
                    ri.Route.UserId == userId);

            if (routeItem == null)
                return false;

            var dayNumber = routeItem.DayNumber;
            var removedOrder = routeItem.OrderInDay;

            // Remove the specific route item
            _context.RouteItems.Remove(routeItem);

            // Update the order of remaining items in the same day
            var remainingItems = await _context.RouteItems
                .Where(ri => ri.RouteId == routeId &&
                           ri.DayNumber == dayNumber &&
                           ri.OrderInDay > removedOrder)
                .ToListAsync();

            foreach (var item in remainingItems)
            {
                item.OrderInDay--;
            }

            routeItem.Route.UpdatedAt = DateTime.UtcNow;
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
        public async Task<bool> ReorderRouteDestinationsAsync(int routeId, int dayNumber, List<int> destinationOrder)
        {
            var userId = _currentUserService.UserId;

            _logger.LogInformation("=== REORDER START ===");
            _logger.LogInformation("Route: {RouteId}, Day: {DayNumber}, User: {UserId}", routeId, dayNumber, userId);
            _logger.LogInformation("New order array: [{Order}]", string.Join(", ", destinationOrder));

            var route = await _context.UserRoutes
                .FirstOrDefaultAsync(r => r.Id == routeId && r.UserId == userId);

            if (route == null)
            {
                _logger.LogWarning("Route not found");
                return false;
            }

            // Получаем только элементы конкретного дня
            var routeItems = await _context.RouteItems
                .Where(ri => ri.RouteId == routeId && ri.DayNumber == dayNumber)
                .ToListAsync();

            _logger.LogInformation("Found {Count} items for day {DayNumber}:", routeItems.Count, dayNumber);
            foreach (var item in routeItems)
            {
                _logger.LogInformation("  - Item ID: {Id}, Current OrderInDay: {Order}", item.Id, item.OrderInDay);
            }

            // Проверяем, что все элементы из destinationOrder существуют
            foreach (var orderId in destinationOrder)
            {
                if (!routeItems.Any(ri => ri.Id == orderId))
                {
                    _logger.LogWarning("Item {ItemId} not found in day {DayNumber}!", orderId, dayNumber);
                    return false;
                }
            }

            // Устанавливаем новый порядок
            _logger.LogInformation("Updating order:");
            for (int i = 0; i < destinationOrder.Count; i++)
            {
                var routeItem = routeItems.First(ri => ri.Id == destinationOrder[i]);
                var oldOrder = routeItem.OrderInDay;
                var newOrder = i + 1;

                _logger.LogInformation("  Item {ItemId}: {OldOrder} -> {NewOrder}",
                    routeItem.Id, oldOrder, newOrder);

                routeItem.OrderInDay = newOrder;
            }

            route.UpdatedAt = DateTime.UtcNow;

            // Важно: проверяем, есть ли изменения для сохранения
            var changeCount = _context.ChangeTracker.Entries()
                .Count(e => e.State == EntityState.Modified);

            _logger.LogInformation("Changes to save: {Count}", changeCount);

            var savedCount = await _context.SaveChangesAsync();
            _logger.LogInformation("Saved {Count} changes to database", savedCount);

            // Проверяем результат после сохранения
            var verifyItems = await _context.RouteItems
                .Where(ri => ri.RouteId == routeId && ri.DayNumber == dayNumber)
                .ToListAsync();

            _logger.LogInformation("Verification after save:");
            foreach (var item in verifyItems.OrderBy(i => i.OrderInDay))
            {
                _logger.LogInformation("  - Item ID: {Id}, OrderInDay: {Order}", item.Id, item.OrderInDay);
            }

            _logger.LogInformation("=== REORDER END ===");

            return true;
        }
        public async Task<RouteItemDto> UpdateRouteItemAsync(int routeItemId, UpdateRouteItemRequest request)
        {
            var userId = _currentUserService.UserId;

            var routeItem = await _context.RouteItems
                .Include(ri => ri.Route)
                .Include(ri => ri.Destination)
                    .ThenInclude(d => d.Category)
                .Include(ri => ri.Destination)
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(ri =>
                    ri.Id == routeItemId &&
                    ri.Route.UserId == userId);

            if (routeItem == null)
                throw new BadHttpRequestException($"Route item with id {routeItemId} not found");

            // Обновление порядка в дне
            if (request.OrderInDay.HasValue && request.OrderInDay != routeItem.OrderInDay)
            {
                await ReorderItemsInDay(routeItem.RouteId, routeItem.DayNumber, routeItem.OrderInDay, request.OrderInDay.Value);
                routeItem.OrderInDay = request.OrderInDay.Value;
            }

            // Обновление дня
            if (request.DayNumber.HasValue && request.DayNumber != routeItem.DayNumber)
            {
                routeItem.DayNumber = request.DayNumber.Value;
            }

            if (request.UserNotes != null)
                routeItem.UserNotes = request.UserNotes;

            if (request.PlannedTime.HasValue)
                routeItem.PlannedTime = request.PlannedTime.Value;

            if (request.IsVisited.HasValue)
                routeItem.IsVisited = request.IsVisited.Value;

            routeItem.Route.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return _mapper.Map<RouteItemDto>(routeItem);
        }

        private async Task ReorderItemsInDay(int routeId, int dayNumber, int oldOrder, int newOrder)
        {
            var itemsToUpdate = await _context.RouteItems
                .Where(ri => ri.RouteId == routeId && ri.DayNumber == dayNumber)
                .ToListAsync();

            if (newOrder < oldOrder)
            {
                // Сдвигаем вверх
                foreach (var item in itemsToUpdate.Where(i => i.OrderInDay >= newOrder && i.OrderInDay < oldOrder))
                {
                    item.OrderInDay++;
                }
            }
            else
            {
                // Сдвигаем вниз
                foreach (var item in itemsToUpdate.Where(i => i.OrderInDay > oldOrder && i.OrderInDay <= newOrder))
                {
                    item.OrderInDay--;
                }
            }
        }
    }
}