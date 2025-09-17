FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 82

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy .csproj for restore (keep project structure)
COPY ["src/weylo.admin.api/weylo.admin.api.csproj", "src/weylo.admin.api/"]
COPY ["src/weylo.shared/weylo.shared.csproj", "src/weylo.shared/"]

# Restore dependencies
RUN dotnet restore "src/weylo.admin.api/weylo.admin.api.csproj"

# Copy code
COPY . .

# Open folder and build project
WORKDIR "/src/src/weylo.admin.api"
RUN dotnet build "weylo.admin.api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "weylo.admin.api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "weylo.admin.api.dll"]