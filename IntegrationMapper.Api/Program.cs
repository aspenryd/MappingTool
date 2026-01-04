using IntegrationMapper.Core.Interfaces;
using IntegrationMapper.Infrastructure.Services;
using IntegrationMapper.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new Microsoft.OpenApi.Models.OpenApiComponents();
        document.Components.SecuritySchemes.Add("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter your JWT Bearer token"
        });

        document.SecurityRequirements.Add(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
        return Task.CompletedTask;
    });
});
builder.Services.AddControllers();

// Register Domain Services
builder.Services.AddScoped<IMappingService, MappingService>();
builder.Services.AddScoped<ISchemaParserService, JsonSchemaParserService>();
builder.Services.AddScoped<IAiMappingService, AiMappingService>();
builder.Services.AddScoped<XsdSchemaParserService>();
builder.Services.AddScoped<ISchemaValidatorService, SchemaValidatorService>();
builder.Services.AddScoped<IExampleExtractionService, ExampleExtractionService>();

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

// Authentication Configuration
var devSecret = builder.Configuration["DevAuth:Secret"];
var isDev = builder.Environment.IsDevelopment();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = isDev ? "DevBearer" : JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = isDev ? "DevBearer" : JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer("DevBearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "integration-mapper-dev",
        ValidAudience = "integration-mapper-dev",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(devSecret ?? "dev-secret-must-be-configured"))
    };
})
.AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

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
    app.MapScalarApiReference();
}

app.UseCors(policy => policy
    .WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
