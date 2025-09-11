FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 81

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/weylo.user.api/weylo.user.api.csproj", "src/weylo.user.api/"]
COPY ["src/weylo.shared/weylo.shared.csproj", "src/weylo.shared/"]

# Restore dependencies
RUN dotnet restore "src/weylo.user.api/weylo.user.api.csproj"

# Copy source code
COPY . .

# Build
WORKDIR "/src/src/weylo.user.api"
RUN dotnet build "weylo.user.api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "weylo.user.api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "weylo.user.api.dll"]