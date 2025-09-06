FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy .csproj for restore (keep project structure)
COPY ["src/weylo.identity/weylo.identity.csproj", "src/weylo.identity/"]
COPY ["src/weylo.shared/weylo.shared.csproj", "src/weylo.shared/"]

# Restore dependecies
RUN dotnet restore "src/weylo.identity/weylo.identity.csproj"

# Copy code
COPY . .

# Open folder and build project
WORKDIR "/src/src/weylo.identity"
RUN dotnet build "weylo.identity.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "weylo.identity.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "weylo.identity.dll"]