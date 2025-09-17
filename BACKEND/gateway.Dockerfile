FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 83

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy gateway project
COPY ["src/weylo.gateway/weylo.gateway.csproj", "src/weylo.gateway/"]

# Restore dependencies
RUN dotnet restore "src/weylo.gateway/weylo.gateway.csproj"

# Copy source code
COPY . .

# Build
WORKDIR "/src/src/weylo.gateway"
RUN dotnet build "weylo.gateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "weylo.gateway.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "weylo.gateway.dll"]