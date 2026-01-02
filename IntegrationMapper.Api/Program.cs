using IntegrationMapper.Core.Interfaces;
using IntegrationMapper.Infrastructure.Services;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Register Domain Services
builder.Services.AddScoped<IMappingService, MappingService>();
builder.Services.AddScoped<ISchemaParserService, JsonSchemaParserService>();
builder.Services.AddScoped<IAiMappingService, AiMappingService>();

// Configure DbContext
builder.Services.AddDbContext<IntegrationMapperContext>(options =>
    options.UseInMemoryDatabase("IntegrationMapperDb"));

// Conditional Service Registration
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
}
else
{
    // Placeholder for Azure Storage, can be added later
    // builder.Services.AddScoped<IFileStorageService, AzureBlobStorageService>();
}

var app = builder.Build();

// Auto-apply migrations in Development
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<IntegrationMapperContext>();
        db.Database.EnsureCreated();

        // Seed Data
        if (!db.IntegrationSystems.Any())
        {
            db.IntegrationSystems.AddRange(
                new IntegrationMapper.Core.Entities.IntegrationSystem { Name = "M3", Category = "ERP", Description = "Infor M3 ERP System", ExternalId = "SYS-M3" },
                new IntegrationMapper.Core.Entities.IntegrationSystem { Name = "Salesforce", Category = "CRM", Description = "Salesforce CRM", ExternalId = "SYS-SF" },
                new IntegrationMapper.Core.Entities.IntegrationSystem { Name = "ECom", Category = "E-Commerce", Description = "E-Commerce Platform", ExternalId = "SYS-ECOM" }
            );
            db.SaveChanges();
        }
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(policy => policy
    .WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
