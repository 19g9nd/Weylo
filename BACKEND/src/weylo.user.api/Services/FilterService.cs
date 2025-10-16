using AutoMapper;
using Microsoft.EntityFrameworkCore;
using weylo.shared.Models;
using weylo.user.api.Data;
using weylo.user.api.DTOS;
using weylo.user.api.Requests;
using weylo.user.api.Services.Interfaces;

namespace weylo.user.api.Services
{
    public class FilterService : IFilterService
    {
        private readonly UserDbContext _context;
        private readonly IMapper _mapper;

        public FilterService(UserDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request)
        {
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == request.Name);

            if (existingCategory != null)
                throw new BadHttpRequestException($"Category with name '{request.Name}' already exists");

            var category = _mapper.Map<Category>(request);

            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync();

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<CategoryTransferResult> TransferCategoryDestinationsAsync(int fromCategoryId, int toCategoryId)
        {
            var fromCategory = await _context.Categories.FindAsync(fromCategoryId);
            var toCategory = await _context.Categories.FindAsync(toCategoryId);

            if (fromCategory == null || toCategory == null)
                throw new BadHttpRequestException("One or both categories not found");

            var destinationsToTransfer = await _context.Destinations
                .Where(d => d.CategoryId == fromCategoryId)
                .ToListAsync();

            foreach (var destination in destinationsToTransfer)
            {
                destination.CategoryId = toCategoryId;
            }

            await _context.SaveChangesAsync();

            return new CategoryTransferResult
            {
                Success = true,
                TransferredDestinationsCount = destinationsToTransfer.Count,
                FromCategoryName = fromCategory.Name,
                ToCategoryName = toCategory.Name
            };
        }

        public async Task<IEnumerable<CategoryDto>> GetCategoriesAsync()
        {
            var categories = await _context.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CategoryDto>>(categories);
        }

        public async Task<bool> DeleteFilterAttributeAsync(int id)
        {
            var attribute = await _context.FilterAttributes
                .Include(fa => fa.FilterValues)
                .Include(fa => fa.CategoryFilters)
                .FirstOrDefaultAsync(fa => fa.Id == id);

            if (attribute == null)
                return false;

            bool hasRelatedData =
                attribute.FilterValues.Any() ||
                attribute.CategoryFilters.Any();

            if (hasRelatedData)
                return false;

            _context.FilterAttributes.Remove(attribute);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CategoryDeletionResult> CanDeleteCategoryAsync(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Destinations)
                .Include(c => c.CategoryFilters)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return new CategoryDeletionResult { CanDelete = false, Reason = "Category not found" };

            var result = new CategoryDeletionResult { CanDelete = true };

            // Проверяем места
            if (category.Destinations.Any())
            {
                result.CanDelete = false;
                result.Reason = $"Category has {category.Destinations.Count} associated destinations";
                result.RelatedDestinationsCount = category.Destinations.Count;
            }

            // Проверяем фильтры категории
            if (category.CategoryFilters.Any())
            {
                result.CanDelete = false;
                result.Reason = $"Category has {category.CategoryFilters.Count} associated filters";
                result.RelatedFiltersCount = category.CategoryFilters.Count;
            }

            return result;
        }

        public async Task<CategoryDeletionResult> DeleteCategoryAsync(int id)
        {
            var deletionCheck = await CanDeleteCategoryAsync(id);

            if (!deletionCheck.CanDelete)
                return deletionCheck;

            var category = await _context.Categories.FindAsync(id);
            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            deletionCheck.Reason = "Category successfully deleted";
            return deletionCheck;
        }

        public async Task<DestinationDto> UpdateDestinationCategoryAsync(int destinationId, int categoryId)
        {
            var destination = await _context.Destinations
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .FirstOrDefaultAsync(d => d.Id == destinationId);

            if (destination == null)
                throw new BadHttpRequestException($"Destination with id {destinationId} not found");

            var category = await _context.Categories.FindAsync(categoryId);
            if (category == null)
                throw new BadHttpRequestException($"Category with id {categoryId} not found");

            destination.CategoryId = categoryId;
            await _context.SaveChangesAsync();

            return _mapper.Map<DestinationDto>(destination);
        }

        public async Task<FilterAttributeDto> CreateFilterAttributeAsync(CreateFilterAttributeRequest request)
        {
            // Проверяем уникальность имени
            var existingAttribute = await _context.FilterAttributes
                .FirstOrDefaultAsync(fa => fa.Name == request.Name);

            if (existingAttribute != null)
                throw new BadHttpRequestException($"Filter attribute with name '{request.Name}' already exists");

            var attribute = _mapper.Map<FilterAttribute>(request);

            await _context.FilterAttributes.AddAsync(attribute);
            await _context.SaveChangesAsync();

            return _mapper.Map<FilterAttributeDto>(attribute);
        }

        public async Task<IEnumerable<FilterAttributeDto>> GetFilterAttributesAsync()
        {
            var attributes = await _context.FilterAttributes
                .OrderBy(fa => fa.DisplayName)
                .ToListAsync();

            return _mapper.Map<IEnumerable<FilterAttributeDto>>(attributes);
        }
        public async Task<List<CategoryFilterDto>> InitializeDefaultFiltersForCategoryAsync(int categoryId)
        {
            var category = await _context.Categories.FindAsync(categoryId);
            if (category == null)
                throw new BadHttpRequestException($"Category with id {categoryId} not found");

            // Определяем какие фильтры нужны для этой категории
            var filterNames = GetDefaultFiltersForCategory(category.Name);

            var result = new List<CategoryFilterDto>();

            foreach (var filterName in filterNames)
            {
                // Проверяем, существует ли такой атрибут
                var attribute = await _context.FilterAttributes
                    .FirstOrDefaultAsync(fa => fa.Name == filterName);

                if (attribute == null)
                {
                    // Создаем новый атрибут, если не существует
                    attribute = await CreateFilterAttributeFromNameAsync(filterName);
                }

                // Проверяем, не добавлен ли уже фильтр
                var existingFilter = await _context.CategoryFilters
                    .FirstOrDefaultAsync(cf =>
                        cf.CategoryId == categoryId &&
                        cf.FilterAttributeId == attribute.Id);

                if (existingFilter == null)
                {
                    var categoryFilter = new CategoryFilter
                    {
                        CategoryId = categoryId,
                        FilterAttributeId = attribute.Id
                    };

                    await _context.CategoryFilters.AddAsync(categoryFilter);
                    await _context.SaveChangesAsync();

                    // Загружаем связанные данные
                    await _context.Entry(categoryFilter)
                        .Reference(cf => cf.Category)
                        .LoadAsync();
                    await _context.Entry(categoryFilter)
                        .Reference(cf => cf.FilterAttribute)
                        .LoadAsync();

                    result.Add(_mapper.Map<CategoryFilterDto>(categoryFilter));
                }
            }

            return result;
        }
        public async Task<CategoryFilterDto> AddFilterToCategoryAsync(AddFilterToCategoryRequest request)
        {
            // Проверяем существование категории и атрибута
            var category = await _context.Categories.FindAsync(request.CategoryId);
            var attribute = await _context.FilterAttributes.FindAsync(request.FilterAttributeId);

            if (category == null || attribute == null)
                throw new BadHttpRequestException("Category or FilterAttribute not found");

            // Проверяем не добавлен ли уже фильтр
            var existingFilter = await _context.CategoryFilters
                .FirstOrDefaultAsync(cf => cf.CategoryId == request.CategoryId &&
                                         cf.FilterAttributeId == request.FilterAttributeId);

            if (existingFilter != null)
                throw new BadHttpRequestException("Filter already added to category");

            var categoryFilter = new CategoryFilter
            {
                CategoryId = request.CategoryId,
                FilterAttributeId = request.FilterAttributeId
            };

            await _context.CategoryFilters.AddAsync(categoryFilter);
            await _context.SaveChangesAsync();

            // Загружаем связанные данные для ответа
            await _context.Entry(categoryFilter)
                .Reference(cf => cf.Category)
                .LoadAsync();
            await _context.Entry(categoryFilter)
                .Reference(cf => cf.FilterAttribute)
                .LoadAsync();

            return _mapper.Map<CategoryFilterDto>(categoryFilter);
        }

        public async Task<bool> RemoveFilterFromCategoryAsync(int categoryId, int filterAttributeId)
        {
            var categoryFilter = await _context.CategoryFilters
                .FirstOrDefaultAsync(cf => cf.CategoryId == categoryId &&
                                         cf.FilterAttributeId == filterAttributeId);

            if (categoryFilter == null)
                return false;

            _context.CategoryFilters.Remove(categoryFilter);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<CategoryFilterDto>> GetCategoryFiltersAsync(int categoryId)
        {
            var filters = await _context.CategoryFilters
                .Where(cf => cf.CategoryId == categoryId)
                .Include(cf => cf.FilterAttribute)
                .Include(cf => cf.Category)
                .ToListAsync();

            return _mapper.Map<IEnumerable<CategoryFilterDto>>(filters);
        }

        public async Task<IEnumerable<DestinationDto>> GetFilteredDestinationsAsync(FilterDestinationsRequest request)
        {
            var query = _context.Destinations
                .Include(d => d.Category)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.FilterValues)
                    .ThenInclude(fv => fv.FilterAttribute)
                .AsQueryable();

            // Фильтр по категории
            if (request.CategoryId.HasValue)
            {
                query = query.Where(d => d.CategoryId == request.CategoryId.Value);
            }

            // Применяем фильтры
            if (request.Filters != null && request.Filters.Any())
            {
                foreach (var filter in request.Filters)
                {
                    query = ApplyFilter(query, filter);
                }
            }

            var destinations = await query
                .OrderByDescending(d => d.CachedRating)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        public async Task<FilterMetadataDto> GetFilterMetadataAsync(int categoryId)
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == categoryId);

            if (category == null)
                throw new BadHttpRequestException($"Category with id {categoryId} not found");

            var availableFilters = await _context.CategoryFilters
                .Where(cf => cf.CategoryId == categoryId)
                .Include(cf => cf.FilterAttribute)
                .Select(cf => cf.FilterAttribute)
                .ToListAsync();

            var filterOptions = new Dictionary<string, List<string>>();

            // Получаем уникальные значения для каждого фильтра
            foreach (var filter in availableFilters)
            {
                var values = await _context.FilterValues
                    .Where(fv => fv.FilterAttributeId == filter.Id &&
                                fv.Destination.CategoryId == categoryId)
                    .Select(fv => fv.Value)
                    .Distinct()
                    .OrderBy(v => v)
                    .ToListAsync();

                filterOptions[filter.Name] = values;
            }

            return new FilterMetadataDto
            {
                CategoryId = categoryId,
                CategoryName = category.Name,
                AvailableFilters = _mapper.Map<List<FilterAttributeDto>>(availableFilters),
                FilterOptions = filterOptions
            };
        }

        public async Task<FilterValueDto> SetFilterValueAsync(SetFilterValueRequest request)
        {
            // Проверяем существование места и атрибута
            var destination = await _context.Destinations.FindAsync(request.DestinationId);
            var attribute = await _context.FilterAttributes.FindAsync(request.FilterAttributeId);

            if (destination == null || attribute == null)
                throw new BadHttpRequestException("Destination or FilterAttribute not found");

            // Находим или создаем значение фильтра
            var existingValue = await _context.FilterValues
                .FirstOrDefaultAsync(fv =>
                    fv.DestinationId == request.DestinationId &&
                    fv.FilterAttributeId == request.FilterAttributeId);

            if (existingValue != null)
            {
                existingValue.Value = request.Value;
            }
            else
            {
                var filterValue = new FilterValue
                {
                    DestinationId = request.DestinationId,
                    FilterAttributeId = request.FilterAttributeId,
                    Value = request.Value
                };
                await _context.FilterValues.AddAsync(filterValue);
                await _context.SaveChangesAsync();
                existingValue = filterValue;
            }

            await _context.SaveChangesAsync();

            // Загружаем связанные данные
            await _context.Entry(existingValue)
                .Reference(fv => fv.FilterAttribute)
                .LoadAsync();
            await _context.Entry(existingValue)
                .Reference(fv => fv.Destination)
                .LoadAsync();

            return _mapper.Map<FilterValueDto>(existingValue);
        }

        public async Task<bool> RemoveFilterValueAsync(int destinationId, int filterAttributeId)
        {
            var filterValue = await _context.FilterValues
                .FirstOrDefaultAsync(fv =>
                    fv.DestinationId == destinationId &&
                    fv.FilterAttributeId == filterAttributeId);

            if (filterValue == null)
                return false;

            _context.FilterValues.Remove(filterValue);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CategoryDto> GetCategoryWithDestinationsAsync(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Destinations) // Загружаем связанные места
                    .ThenInclude(d => d.City)
                    .ThenInclude(c => c.Country)
                .FirstOrDefaultAsync(c => c.Id == id);

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<IEnumerable<DestinationDto>> GetDestinationsByCategoryAsync(int categoryId)
        {
            var destinations = await _context.Destinations
                .Where(d => d.CategoryId == categoryId)
                .Include(d => d.City)
                    .ThenInclude(c => c.Country)
                .Include(d => d.Category)
                .OrderByDescending(d => d.CachedRating)
                .ToListAsync();

            return _mapper.Map<IEnumerable<DestinationDto>>(destinations);
        }

        // --- Helper Methods ---
        private IQueryable<Destination> ApplyFilter(IQueryable<Destination> query, FilterCriteria filter)
        {
            return filter.Operator?.ToLower() switch
            {
                "greater" => ApplyNumericFilter(query, filter, "greater"),
                "less" => ApplyNumericFilter(query, filter, "less"),
                "greater_or_equal" => ApplyNumericFilter(query, filter, "greater_or_equal"),
                "less_or_equal" => ApplyNumericFilter(query, filter, "less_or_equal"),
                "contains" => query.Where(d => d.FilterValues
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              EF.Functions.ILike(fv.Value, $"%{filter.Value}%"))),
                "starts_with" => query.Where(d => d.FilterValues
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              EF.Functions.ILike(fv.Value, $"{filter.Value}%"))),
                "ends_with" => query.Where(d => d.FilterValues
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              EF.Functions.ILike(fv.Value, $"%{filter.Value}"))),
                "in" => ApplyInFilter(query, filter),
                _ => query.Where(d => d.FilterValues // equals (default)
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              fv.Value == filter.Value))
            };
        }

        private IQueryable<Destination> ApplyNumericFilter(IQueryable<Destination> query, FilterCriteria filter, string operation)
        {
            if (!decimal.TryParse(filter.Value, out decimal filterNumber))
                return query.Where(d => false); 

            return operation switch
            {
                "greater" => query.Where(d => d.FilterValues
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              decimal.Parse(fv.Value) > filterNumber)),
                "less" => query.Where(d => d.FilterValues
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              decimal.Parse(fv.Value) < filterNumber)),
                "greater_or_equal" => query.Where(d => d.FilterValues
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              decimal.Parse(fv.Value) >= filterNumber)),
                "less_or_equal" => query.Where(d => d.FilterValues
                    .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                              decimal.Parse(fv.Value) <= filterNumber)),
                _ => query
            };
        }

        private IQueryable<Destination> ApplyInFilter(IQueryable<Destination> query, FilterCriteria filter)
        {
            var values = filter.Value.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(v => v.Trim())
                .ToArray();

            return query.Where(d => d.FilterValues
                .Any(fv => fv.FilterAttributeId == filter.FilterAttributeId &&
                          values.Contains(fv.Value)));
        }

        private List<string> GetDefaultFiltersForCategory(string categoryName)
        {
            var commonFilters = new List<string> { "rating", "price_level" };

            var specificFilters = categoryName.ToLower() switch
            {
                "restaurants & dining" or "restaurants" or "cafe" => new List<string>
        {
            "takeout", "delivery", "dine_in", "reservable",
            "serves_beer", "serves_wine", "serves_vegetarian",
            "serves_breakfast", "serves_lunch", "serves_dinner"
        },
                "hotels & lodging" or "hotels" => new List<string>
        {
            "star_rating", "free_wifi", "pool", "parking", "wheelchair_accessible"
        },
                "museums & culture" or "tourist attractions" => new List<string>
        {
            "opening_hours", "wheelchair_accessible", "phone", "website"
        },
                "shopping" => new List<string>
        {
            "opening_hours", "phone", "website"
        },
                "nature & parks" => new List<string>
        {
            "wheelchair_accessible", "opening_hours"
        },
                _ => new List<string> { "opening_hours", "phone", "website" }
            };

            commonFilters.AddRange(specificFilters);
            return commonFilters.Distinct().ToList();
        }

        private async Task<FilterAttribute> CreateFilterAttributeFromNameAsync(string filterName)
        {
            var (displayName, dataType) = GetFilterAttributeMetadata(filterName);

            var attribute = new FilterAttribute
            {
                Name = filterName,
                DisplayName = displayName,
                DataType = dataType
            };

            await _context.FilterAttributes.AddAsync(attribute);
            await _context.SaveChangesAsync();

            return attribute;
        }

        private (string displayName, string dataType) GetFilterAttributeMetadata(string filterName)
        {
            return filterName.ToLower() switch
            {
                "rating" => ("Rating", "number"),
                "price_level" => ("Price Level", "number"),
                "opening_hours" => ("Opening Hours", "string"),
                "phone" => ("Phone Number", "string"),
                "website" => ("Website", "string"),
                "wheelchair_accessible" => ("Wheelchair Accessible", "boolean"),
                "takeout" => ("Takeout Available", "boolean"),
                "delivery" => ("Delivery Available", "boolean"),
                "dine_in" => ("Dine-in Available", "boolean"),
                "reservable" => ("Reservations Available", "boolean"),
                "serves_beer" => ("Serves Beer", "boolean"),
                "serves_wine" => ("Serves Wine", "boolean"),
                "serves_vegetarian" => ("Vegetarian Options", "boolean"),
                "serves_breakfast" => ("Serves Breakfast", "boolean"),
                "serves_lunch" => ("Serves Lunch", "boolean"),
                "serves_dinner" => ("Serves Dinner", "boolean"),
                "star_rating" => ("Star Rating", "number"),
                "free_wifi" => ("Free WiFi", "boolean"),
                "pool" => ("Swimming Pool", "boolean"),
                "parking" => ("Parking Available", "boolean"),
                _ => (filterName.Replace("_", " "), "string")
            };
        }
    }
}