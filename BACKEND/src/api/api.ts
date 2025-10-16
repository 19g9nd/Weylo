/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AddDayRequest {
  /** @format int32 */
  dayNumber?: number;
  /** @format date-time */
  date?: string | null;
  notes?: string | null;
}

export interface AddDestinationToRouteRequest {
  /** @format int32 */
  destinationId?: number;
  /** @format int32 */
  dayNumber?: number;
  /** @format int32 */
  orderInDay?: number;
  userNotes?: string | null;
  /** @format date-time */
  plannedVisitDate?: string | null;
  estimatedDuration?: string | null;
}

export interface AddFilterToCategoryRequest {
  /** @format int32 */
  categoryId?: number;
  /** @format int32 */
  filterAttributeId?: number;
}

export interface CategoryDeletionResult {
  canDelete?: boolean;
  reason?: string | null;
  /** @format int32 */
  relatedDestinationsCount?: number;
  /** @format int32 */
  relatedFiltersCount?: number;
}

export interface CategoryDto {
  /** @format int32 */
  id?: number;
  name?: string | null;
  description?: string | null;
  googleTypes?: string | null;
  icon?: string | null;
  color?: string | null;
  /** @format int32 */
  displayOrder?: number;
  isAutoAssignable?: boolean;
  /** @format date-time */
  createdAt?: string;
  /** @format int32 */
  destinationsCount?: number;
  /** @format int32 */
  userDestinationsCount?: number;
}

export interface CategoryFilterDto {
  /** @format int32 */
  categoryId?: number;
  /** @format int32 */
  filterAttributeId?: number;
  categoryName?: string | null;
  attributeName?: string | null;
  displayName?: string | null;
  dataType?: string | null;
}

export interface CategoryTransferResult {
  success?: boolean;
  /** @format int32 */
  transferredDestinationsCount?: number;
  fromCategoryName?: string | null;
  toCategoryName?: string | null;
}

export interface ChangeUsernameRequest {
  /**
   * @minLength 3
   * @maxLength 50
   */
  newUsername: string;
}

export interface CreateCategoryRequest {
  /**
   * @minLength 0
   * @maxLength 100
   */
  name: string;
  /**
   * @minLength 0
   * @maxLength 500
   */
  description?: string | null;
  googleTypes?: string | null;
  icon?: string | null;
  color?: string | null;
  /** @format int32 */
  displayOrder?: number | null;
  isAutoAssignable?: boolean;
}

export interface CreateFilterAttributeRequest {
  name?: string | null;
  displayName?: string | null;
  dataType?: string | null;
}

export interface CreateRouteRequest {
  /**
   * @minLength 1
   * @maxLength 200
   */
  name: string;
  /** @format date-time */
  startDate: string;
  /** @format date-time */
  endDate: string;
  /** @maxLength 1000 */
  notes?: string | null;
}

export interface DestinationDto {
  /** @format int32 */
  id?: number;
  name?: string | null;
  /** @format double */
  latitude?: number;
  /** @format double */
  longitude?: number;
  googlePlaceId?: string | null;
  cachedDescription?: string | null;
  /** @format double */
  cachedRating?: number | null;
  cachedImageUrl?: string | null;
  cachedAddress?: string | null;
  /** @format date-time */
  cacheUpdatedAt?: string | null;
  googleType?: string | null;
  /** @format int32 */
  categoryId?: number;
  categoryName?: string | null;
  /** @format int32 */
  cityId?: number;
  cityName?: string | null;
  countryName?: string | null;
  countryCode?: string | null;
  filterValues?: FilterValueDto[] | null;
  /** @format int32 */
  usageCount?: number;
  /** @format date-time */
  createdAt?: string;
}

export interface FilterAttributeDto {
  /** @format int32 */
  id?: number;
  name?: string | null;
  displayName?: string | null;
  dataType?: string | null;
}

export interface FilterCriteria {
  /** @format int32 */
  filterAttributeId?: number;
  value?: string | null;
  operator?: string | null;
}

export interface FilterDestinationsRequest {
  /** @format int32 */
  categoryId?: number | null;
  filters?: FilterCriteria[] | null;
}

export interface FilterMetadataDto {
  /** @format int32 */
  categoryId?: number;
  categoryName?: string | null;
  availableFilters?: FilterAttributeDto[] | null;
  filterOptions?: Record<string, string[]>;
}

export interface FilterValueDto {
  /** @format int32 */
  id?: number;
  value?: string | null;
  attributeName?: string | null;
  displayName?: string | null;
  dataType?: string | null;
}

export interface MoveDestinationRequest {
  /** @format int32 */
  newDayNumber?: number;
  /** @format int32 */
  newOrderInDay?: number;
}

export interface ReorderDestinationsRequest {
  /** @minItems 1 */
  destinationOrder: number[];
}

export interface RouteDayDto {
  /** @format int32 */
  id?: number;
  /** @format int32 */
  dayNumber?: number;
  /** @format date-time */
  date?: string | null;
  notes?: string | null;
  routeDestinations?: RouteDestinationDto[] | null;
}

export interface RouteDestinationDto {
  /** @format int32 */
  id?: number;
  /** @format int32 */
  orderInDay?: number;
  /** @format date-time */
  plannedVisitDate?: string | null;
  estimatedDuration?: TimeSpan;
  userNotes?: string | null;
  isVisited?: boolean;
  /** @format date-time */
  actualVisitDate?: string | null;
  /** @format date-time */
  createdAt?: string;
  destination?: DestinationDto;
}

export interface RouteDetailsDto {
  /** @format int32 */
  id?: number;
  name?: string | null;
  /** @format date-time */
  startDate?: string;
  /** @format date-time */
  endDate?: string;
  notes?: string | null;
  status?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
  routeDays?: RouteDayDto[] | null;
}

export interface RouteDto {
  /** @format int32 */
  id?: number;
  name?: string | null;
  /** @format date-time */
  startDate?: string;
  /** @format date-time */
  endDate?: string;
  notes?: string | null;
  status?: string | null;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
  /** @format int32 */
  totalDays?: number;
  /** @format int32 */
  totalDestinations?: number;
  /** @format int32 */
  destinationsCount?: number;
  /** @format int32 */
  visitedDestinationsCount?: number;
}

export interface SavePlaceRequest {
  googlePlaceId?: string | null;
  name?: string | null;
  /** @format double */
  latitude?: number;
  /** @format double */
  longitude?: number;
  address?: string | null;
  googleTypes?: string[] | null;
  /** @format double */
  rating?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  cityName?: string | null;
  countryName?: string | null;
  /** @format int32 */
  priceLevel?: number | null;
  openingHours?: string | null;
  phone?: string | null;
  website?: string | null;
  wheelchairAccessible?: boolean | null;
  takeout?: boolean | null;
  delivery?: boolean | null;
  dineIn?: boolean | null;
  reservable?: boolean | null;
  servesBeer?: boolean | null;
  servesWine?: boolean | null;
  servesBreakfast?: boolean | null;
  servesLunch?: boolean | null;
  servesDinner?: boolean | null;
  servesVegetarian?: boolean | null;
  /** @format int32 */
  starRating?: number | null;
  freeWifi?: boolean | null;
  pool?: boolean | null;
  parking?: boolean | null;
  userRatingsTotal?: string | null;
  editorialSummary?: string | null;
}

export interface SetFilterValueRequest {
  /** @format int32 */
  destinationId?: number;
  /** @format int32 */
  filterAttributeId?: number;
  value?: string | null;
}

export interface TimeSpan {
  /** @format int64 */
  ticks?: number;
  /** @format int32 */
  days?: number;
  /** @format int32 */
  hours?: number;
  /** @format int32 */
  milliseconds?: number;
  /** @format int32 */
  microseconds?: number;
  /** @format int32 */
  nanoseconds?: number;
  /** @format int32 */
  minutes?: number;
  /** @format int32 */
  seconds?: number;
  /** @format double */
  totalDays?: number;
  /** @format double */
  totalHours?: number;
  /** @format double */
  totalMilliseconds?: number;
  /** @format double */
  totalMicroseconds?: number;
  /** @format double */
  totalNanoseconds?: number;
  /** @format double */
  totalMinutes?: number;
  /** @format double */
  totalSeconds?: number;
}

export interface TransferCategoryRequest {
  /** @format int32 */
  fromCategoryId?: number;
  /** @format int32 */
  toCategoryId?: number;
}

export interface UpdateCacheRequest {
  description?: string | null;
  /** @format double */
  rating?: number | null;
  imageUrl?: string | null;
  address?: string | null;
}

export interface UpdateDayRequest {
  /** @format date-time */
  date?: string | null;
  notes?: string | null;
}

export interface UpdateRouteDestinationRequest {
  /** @format int32 */
  orderInDay?: number | null;
  /** @format date-time */
  plannedVisitDate?: string | null;
  estimatedDuration?: string | null;
  userNotes?: string | null;
  isVisited?: boolean | null;
  /** @format date-time */
  actualVisitDate?: string | null;
}

export interface UpdateRouteRequest {
  /** @maxLength 200 */
  name?: string | null;
  /** @format date-time */
  startDate?: string | null;
  /** @format date-time */
  endDate?: string | null;
  /** @maxLength 1000 */
  notes?: string | null;
  /** @maxLength 50 */
  status?: string | null;
}

export interface UpdateUserDestinationRequest {
  isFavorite?: boolean | null;
  personalNotes?: string | null;
}

export interface UserDestinationDto {
  /** @format int32 */
  id?: number;
  /** @format date-time */
  savedAt?: string;
  isFavorite?: boolean;
  personalNotes?: string | null;
  /** @format int32 */
  usageCount?: number;
  destination?: DestinationDto;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title Weylo User API
 * @version v1
 *
 * User profile API for Weylo
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsSaveCreate
     * @summary Save a new place/destination to the catalogue
     * @request POST:/api/Destinations/save
     * @secure
     */
    destinationsSaveCreate: (
      data: SavePlaceRequest,
      params: RequestParams = {},
    ) =>
      this.request<DestinationDto, any>({
        path: `/api/Destinations/save`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsMyList
     * @summary Get user's saved destinations
     * @request GET:/api/Destinations/my
     * @secure
     */
    destinationsMyList: (params: RequestParams = {}) =>
      this.request<UserDestinationDto[], any>({
        path: `/api/Destinations/my`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsMyCreate
     * @summary Add a destination to user's collection
     * @request POST:/api/Destinations/my/{destinationId}
     * @secure
     */
    destinationsMyCreate: (destinationId: number, params: RequestParams = {}) =>
      this.request<UserDestinationDto, any>({
        path: `/api/Destinations/my/${destinationId}`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsMyDelete
     * @summary Remove a destination from user's collection
     * @request DELETE:/api/Destinations/my/{destinationId}
     * @secure
     */
    destinationsMyDelete: (destinationId: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Destinations/my/${destinationId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsMyUpdate
     * @summary Update user-specific destination data (favorites, notes)
     * @request PUT:/api/Destinations/my/{userDestinationId}
     * @secure
     */
    destinationsMyUpdate: (
      userDestinationId: number,
      data: UpdateUserDestinationRequest,
      params: RequestParams = {},
    ) =>
      this.request<UserDestinationDto, any>({
        path: `/api/Destinations/my/${userDestinationId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsMyFavoriteUpdate
     * @summary Toggle favorite status for a user's destination
     * @request PUT:/api/Destinations/my/{userDestinationId}/favorite
     * @secure
     */
    destinationsMyFavoriteUpdate: (
      userDestinationId: number,
      params: RequestParams = {},
    ) =>
      this.request<UserDestinationDto, any>({
        path: `/api/Destinations/my/${userDestinationId}/favorite`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsCatalogueList
     * @summary Get all destinations catalog (public or admin)
     * @request GET:/api/Destinations/catalogue
     * @secure
     */
    destinationsCatalogueList: (params: RequestParams = {}) =>
      this.request<DestinationDto[], any>({
        path: `/api/Destinations/catalogue`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsPopularList
     * @summary Get popular destinations
     * @request GET:/api/Destinations/popular
     * @secure
     */
    destinationsPopularList: (
      query?: {
        /**
         * @format int32
         * @default 20
         */
        take?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<DestinationDto[], any>({
        path: `/api/Destinations/popular`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsDetail
     * @summary Get specific destination by ID
     * @request GET:/api/Destinations/{id}
     * @secure
     */
    destinationsDetail: (id: number, params: RequestParams = {}) =>
      this.request<DestinationDto, any>({
        path: `/api/Destinations/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsDelete
     * @summary Delete destination (only if not used in routes)
     * @request DELETE:/api/Destinations/{id}
     * @secure
     */
    destinationsDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Destinations/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsByCityDetail
     * @summary Get destinations by city
     * @request GET:/api/Destinations/by-city/{cityId}
     * @secure
     */
    destinationsByCityDetail: (cityId: number, params: RequestParams = {}) =>
      this.request<DestinationDto[], any>({
        path: `/api/Destinations/by-city/${cityId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsSearchList
     * @summary Search destinations by query
     * @request GET:/api/Destinations/search
     * @secure
     */
    destinationsSearchList: (
      query?: {
        query?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<DestinationDto[], any>({
        path: `/api/Destinations/search`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Destinations
     * @name DestinationsCacheUpdate
     * @summary Update cached information for a destination
     * @request PUT:/api/Destinations/{id}/cache
     * @secure
     */
    destinationsCacheUpdate: (
      id: number,
      data: UpdateCacheRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Destinations/${id}/cache`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesList
     * @request GET:/api/Filters/categories
     * @secure
     */
    filtersCategoriesList: (params: RequestParams = {}) =>
      this.request<CategoryDto[], any>({
        path: `/api/Filters/categories`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesCreate
     * @request POST:/api/Filters/categories
     * @secure
     */
    filtersCategoriesCreate: (
      data: CreateCategoryRequest,
      params: RequestParams = {},
    ) =>
      this.request<CategoryDto, any>({
        path: `/api/Filters/categories`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesDetail
     * @request GET:/api/Filters/categories/{id}
     * @secure
     */
    filtersCategoriesDetail: (id: number, params: RequestParams = {}) =>
      this.request<CategoryDto, any>({
        path: `/api/Filters/categories/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesDelete
     * @request DELETE:/api/Filters/categories/{id}
     * @secure
     */
    filtersCategoriesDelete: (id: number, params: RequestParams = {}) =>
      this.request<CategoryDeletionResult, any>({
        path: `/api/Filters/categories/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesInitializeFiltersCreate
     * @summary Initialize default filters for a category based on its type
     * @request POST:/api/Filters/categories/{categoryId}/initialize-filters
     * @secure
     */
    filtersCategoriesInitializeFiltersCreate: (
      categoryId: number,
      params: RequestParams = {},
    ) =>
      this.request<CategoryFilterDto[], any>({
        path: `/api/Filters/categories/${categoryId}/initialize-filters`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesCanDeleteList
     * @request GET:/api/Filters/categories/{id}/can-delete
     * @secure
     */
    filtersCategoriesCanDeleteList: (id: number, params: RequestParams = {}) =>
      this.request<CategoryDeletionResult, any>({
        path: `/api/Filters/categories/${id}/can-delete`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesTransferCreate
     * @request POST:/api/Filters/categories/transfer
     * @secure
     */
    filtersCategoriesTransferCreate: (
      data: TransferCategoryRequest,
      params: RequestParams = {},
    ) =>
      this.request<CategoryTransferResult, any>({
        path: `/api/Filters/categories/transfer`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersDestinationsCategoryUpdate
     * @request PUT:/api/Filters/destinations/{destinationId}/category/{categoryId}
     * @secure
     */
    filtersDestinationsCategoryUpdate: (
      destinationId: number,
      categoryId: number,
      params: RequestParams = {},
    ) =>
      this.request<DestinationDto, any>({
        path: `/api/Filters/destinations/${destinationId}/category/${categoryId}`,
        method: "PUT",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesDestinationsList
     * @request GET:/api/Filters/categories/{categoryId}/destinations
     * @secure
     */
    filtersCategoriesDestinationsList: (
      categoryId: number,
      params: RequestParams = {},
    ) =>
      this.request<DestinationDto[], any>({
        path: `/api/Filters/categories/${categoryId}/destinations`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersAttributesList
     * @request GET:/api/Filters/attributes
     * @secure
     */
    filtersAttributesList: (params: RequestParams = {}) =>
      this.request<FilterAttributeDto[], any>({
        path: `/api/Filters/attributes`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersAttributesCreate
     * @request POST:/api/Filters/attributes
     * @secure
     */
    filtersAttributesCreate: (
      data: CreateFilterAttributeRequest,
      params: RequestParams = {},
    ) =>
      this.request<FilterAttributeDto, any>({
        path: `/api/Filters/attributes`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersAttributesDelete
     * @request DELETE:/api/Filters/attributes/{id}
     * @secure
     */
    filtersAttributesDelete: (id: number, params: RequestParams = {}) =>
      this.request<boolean, any>({
        path: `/api/Filters/attributes/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesFiltersList
     * @request GET:/api/Filters/categories/{categoryId}/filters
     * @secure
     */
    filtersCategoriesFiltersList: (
      categoryId: number,
      params: RequestParams = {},
    ) =>
      this.request<CategoryFilterDto[], any>({
        path: `/api/Filters/categories/${categoryId}/filters`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesFiltersCreate
     * @request POST:/api/Filters/categories/{categoryId}/filters
     * @secure
     */
    filtersCategoriesFiltersCreate: (
      categoryId: number,
      data: AddFilterToCategoryRequest,
      params: RequestParams = {},
    ) =>
      this.request<CategoryFilterDto, any>({
        path: `/api/Filters/categories/${categoryId}/filters`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesFiltersDelete
     * @request DELETE:/api/Filters/categories/{categoryId}/filters/{filterAttributeId}
     * @secure
     */
    filtersCategoriesFiltersDelete: (
      categoryId: number,
      filterAttributeId: number,
      params: RequestParams = {},
    ) =>
      this.request<boolean, any>({
        path: `/api/Filters/categories/${categoryId}/filters/${filterAttributeId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersValuesCreate
     * @request POST:/api/Filters/values
     * @secure
     */
    filtersValuesCreate: (
      data: SetFilterValueRequest,
      params: RequestParams = {},
    ) =>
      this.request<FilterValueDto, any>({
        path: `/api/Filters/values`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersDestinationsAttributesDelete
     * @request DELETE:/api/Filters/destinations/{destinationId}/attributes/{filterAttributeId}
     * @secure
     */
    filtersDestinationsAttributesDelete: (
      destinationId: number,
      filterAttributeId: number,
      params: RequestParams = {},
    ) =>
      this.request<boolean, any>({
        path: `/api/Filters/destinations/${destinationId}/attributes/${filterAttributeId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersDestinationsFilterCreate
     * @request POST:/api/Filters/destinations/filter
     * @secure
     */
    filtersDestinationsFilterCreate: (
      data: FilterDestinationsRequest,
      params: RequestParams = {},
    ) =>
      this.request<DestinationDto[], any>({
        path: `/api/Filters/destinations/filter`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filters
     * @name FiltersCategoriesMetadataList
     * @request GET:/api/Filters/categories/{categoryId}/metadata
     * @secure
     */
    filtersCategoriesMetadataList: (
      categoryId: number,
      params: RequestParams = {},
    ) =>
      this.request<FilterMetadataDto, any>({
        path: `/api/Filters/categories/${categoryId}/metadata`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteList
     * @summary Get all routes for the current user
     * @request GET:/api/Route
     * @secure
     */
    routeList: (params: RequestParams = {}) =>
      this.request<RouteDto[], any>({
        path: `/api/Route`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteCreate
     * @summary Create new route
     * @request POST:/api/Route
     * @secure
     */
    routeCreate: (data: CreateRouteRequest, params: RequestParams = {}) =>
      this.request<RouteDto, any>({
        path: `/api/Route`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDetail
     * @summary Get route details
     * @request GET:/api/Route/{id}
     * @secure
     */
    routeDetail: (id: number, params: RequestParams = {}) =>
      this.request<RouteDetailsDto, any>({
        path: `/api/Route/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteUpdate
     * @summary Update route info
     * @request PUT:/api/Route/{id}
     * @secure
     */
    routeUpdate: (
      id: number,
      data: UpdateRouteRequest,
      params: RequestParams = {},
    ) =>
      this.request<RouteDto, any>({
        path: `/api/Route/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDelete
     * @summary Delete route
     * @request DELETE:/api/Route/{id}
     * @secure
     */
    routeDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/Route/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDestinationsCreate
     * @summary Add destination to route
     * @request POST:/api/Route/{routeId}/destinations
     * @secure
     */
    routeDestinationsCreate: (
      routeId: number,
      data: AddDestinationToRouteRequest,
      params: RequestParams = {},
    ) =>
      this.request<RouteDestinationDto, any>({
        path: `/api/Route/${routeId}/destinations`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDestinationsUpdate
     * @summary Update a specific route destination
     * @request PUT:/api/Route/destinations/{routeDestinationId}
     * @secure
     */
    routeDestinationsUpdate: (
      routeDestinationId: number,
      data: UpdateRouteDestinationRequest,
      params: RequestParams = {},
    ) =>
      this.request<RouteDestinationDto, any>({
        path: `/api/Route/destinations/${routeDestinationId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDestinationsReorderUpdate
     * @summary Reorder destinations in route
     * @request PUT:/api/Route/{routeId}/destinations/reorder
     * @secure
     */
    routeDestinationsReorderUpdate: (
      routeId: number,
      data: ReorderDestinationsRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Route/${routeId}/destinations/reorder`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDestinationsDelete
     * @summary Remove destination from route
     * @request DELETE:/api/Route/{routeId}/destinations/{destinationId}
     * @secure
     */
    routeDestinationsDelete: (
      routeId: number,
      destinationId: number,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Route/${routeId}/destinations/${destinationId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDaysCreate
     * @summary Add a new day to route
     * @request POST:/api/Route/{routeId}/days
     * @secure
     */
    routeDaysCreate: (
      routeId: number,
      data: AddDayRequest,
      params: RequestParams = {},
    ) =>
      this.request<RouteDayDto, any>({
        path: `/api/Route/${routeId}/days`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDaysUpdate
     * @summary Update a route day
     * @request PUT:/api/Route/days/{routeDayId}
     * @secure
     */
    routeDaysUpdate: (
      routeDayId: number,
      data: UpdateDayRequest,
      params: RequestParams = {},
    ) =>
      this.request<RouteDayDto, any>({
        path: `/api/Route/days/${routeDayId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDestinationsMoveUpdate
     * @summary Move destination to another day
     * @request PUT:/api/Route/destinations/{routeDestinationId}/move
     * @secure
     */
    routeDestinationsMoveUpdate: (
      routeDestinationId: number,
      data: MoveDestinationRequest,
      params: RequestParams = {},
    ) =>
      this.request<RouteDestinationDto, any>({
        path: `/api/Route/destinations/${routeDestinationId}/move`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Route
     * @name RouteDaysDelete
     * @summary Remove a day from route
     * @request DELETE:/api/Route/{routeId}/days/{dayNumber}
     * @secure
     */
    routeDaysDelete: (
      routeId: number,
      dayNumber: number,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Route/${routeId}/days/${dayNumber}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserMeList
     * @request GET:/api/User/me
     * @secure
     */
    userMeList: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/User/me`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserUsernameUpdate
     * @request PUT:/api/User/username
     * @secure
     */
    userUsernameUpdate: (
      data: ChangeUsernameRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/User/username`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
}
