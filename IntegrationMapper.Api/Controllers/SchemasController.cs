using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Entities;
using IntegrationMapper.Core.Interfaces;
using IntegrationMapper.Infrastructure.Data;
using IntegrationMapper.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace IntegrationMapper.Api.Controllers
{
    [ApiController]
    [Route("api/schemas")]
    public class SchemasController : ControllerBase
    {
        private readonly IntegrationMapperContext _context;
        private readonly IFileStorageService _fileStorage;
        private readonly ISchemaParserService _jsonSchemaParser;
        private readonly XsdSchemaParserService _xsdSchemaParser;
        private readonly ISchemaValidatorService _schemaValidator;
        private readonly IExampleExtractionService _exampleExtractor;

        public SchemasController(
            IntegrationMapperContext context,
            IFileStorageService fileStorage,
            ISchemaParserService jsonSchemaParser,
            XsdSchemaParserService xsdSchemaParser,
            ISchemaValidatorService schemaValidator,
            IExampleExtractionService exampleExtractor)
        {
            _context = context;
            _fileStorage = fileStorage;
            _jsonSchemaParser = jsonSchemaParser;
            _xsdSchemaParser = xsdSchemaParser;
            _schemaValidator = schemaValidator;
            _exampleExtractor = exampleExtractor;
        }

        [HttpPost("ingest")]
        public async Task<ActionResult<SchemaUploadResponseDto>> IngestSchema([FromForm] IngestSchemaDto dto)
        {
            if (dto.File == null || dto.File.Length == 0)
                return BadRequest("No file uploaded.");

            var system = await _context.IntegrationSystems.FirstOrDefaultAsync(s => s.PublicId == dto.SystemPublicId);
            if (system == null) return NotFound("System not found");

            // 0. Detect Format
            var extension = Path.GetExtension(dto.File.FileName).ToLower();
            string schemaType = extension == ".xsd" ? "XSD" : "JSON";

            // 1. Save file
            string fileReference;
            using (var stream = dto.File.OpenReadStream())
            {
                fileReference = await _fileStorage.UploadFileAsync(stream, dto.File.FileName);
            }

            // 2. Parse Schema
            List<FieldDefinition> fields;
            try 
            {
                using (var stream = dto.File.OpenReadStream())
                {
                    if (schemaType == "XSD")
                    {
                        fields = await _xsdSchemaParser.ParseSchemaAsync(stream, "XSD");
                    }
                    else
                    {
                        fields = await _jsonSchemaParser.ParseSchemaAsync(stream, "JSON");
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"Schema Validation Failed: {ex.Message}");
            }

            // 3. Create DataObject
            var dataObject = new DataObject
            {
                IntegrationSystemId = system.Id,
                Name = dto.Name,
                SchemaType = schemaType,
                FileReference = fileReference
            };

            _context.DataObjects.Add(dataObject);
            await _context.SaveChangesAsync();

            // 4. Save Fields
            foreach (var field in fields)
            {
                field.DataObjectId = dataObject.Id;
            }

            _context.FieldDefinitions.AddRange(fields);
            await _context.SaveChangesAsync();

            return Ok(new SchemaUploadResponseDto
            {
                DataObjectPublicId = dataObject.PublicId,
                Name = dataObject.Name,
                FieldCount = fields.Count
            });
        }
        
        [HttpGet("system/{systemPublicId:guid}")]
        public async Task<ActionResult<List<DataObjectDto>>> GetDataObjects(Guid systemPublicId)
        {
             var system = await _context.IntegrationSystems.FirstOrDefaultAsync(s => s.PublicId == systemPublicId);
             if (system == null) return NotFound("System not found");

             var objects = await _context.DataObjects
                .Where(d => d.IntegrationSystemId == system.Id)
                .Include(d => d.Examples)
                .ToListAsync();
                
            return Ok(objects.Select(d => new DataObjectDto
            {
                Id = d.PublicId,
                SystemPublicId = system.PublicId,
                Name = d.Name,
                SchemaType = d.SchemaType,
                FileReference = d.FileReference,
                Examples = d.Examples.Select(e => new DataObjectExampleDto
                {
                    Id = e.PublicId,
                    FileName = e.FileName,
                    UploadedAt = e.UploadedAt
                }).ToList()
            }).ToList());
        }

        [HttpGet("{id:guid}/content")]
        public async Task<IActionResult> GetSchemaContent(Guid id)
        {
            var dataObject = await _context.DataObjects.FirstOrDefaultAsync(d => d.PublicId == id);
            if (dataObject == null || string.IsNullOrEmpty(dataObject.FileReference))
                return NotFound();

            var stream = await _fileStorage.GetFileAsync(dataObject.FileReference);
            if (stream == null) return NotFound("File not found on storage");

            string contentType = dataObject.SchemaType == "XSD" ? "application/xml" : "application/json";
            return File(stream, contentType, Path.GetFileName(dataObject.FileReference));
        }
        [HttpPost("data-objects/{id:guid}/examples")]
        public async Task<ActionResult<DataObjectExampleDto>> UploadExample(Guid id, [FromForm] IFormFile file)
        {
            var dataObject = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.PublicId == id);

            if (dataObject == null) return NotFound();

            if (file == null || file.Length == 0) return BadRequest("No file uploaded");

            // Validate against schema if schema exists
            if (!string.IsNullOrEmpty(dataObject.FileReference))
            {
                var schemaStream = await _fileStorage.GetFileAsync(dataObject.FileReference);
                if (schemaStream != null)
                {
                    using (schemaStream)
                    using (var exampleStream = file.OpenReadStream())
                    {
                         var errors = await _schemaValidator.ValidateExampleAsync(schemaStream, dataObject.SchemaType, exampleStream);
                         if (errors.Any())
                         {
                             return BadRequest(new { Message = "Example file does not match the schema.", Errors = errors });
                         }
                    }
                }
            }

            string fileReference;
            using (var stream = file.OpenReadStream())
            {
                fileReference = await _fileStorage.UploadFileAsync(stream, file.FileName);
            }

            var example = new DataObjectExample
            {
                DataObjectId = dataObject.Id,
                FileName = file.FileName,
                FileStoragePath = fileReference,
                UploadedAt = DateTime.UtcNow
            };

            _context.DataObjectExamples.Add(example);
            await _context.SaveChangesAsync();

            return Ok(new DataObjectExampleDto
            {
                Id = example.PublicId,
                FileName = example.FileName,
                UploadedAt = example.UploadedAt
            });
        }

        [HttpGet("examples/{exampleId:guid}/content")]
        public async Task<IActionResult> GetExampleContent(Guid exampleId)
        {
            var example = await _context.DataObjectExamples.FirstOrDefaultAsync(e => e.PublicId == exampleId);
            if (example == null) return NotFound();

            var stream = await _fileStorage.GetFileAsync(example.FileStoragePath);
            if (stream == null) return NotFound("File not found on storage");

            // Guess content type or default
            string contentType = "application/octet-stream";
            if (example.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) contentType = "application/json";
            else if (example.FileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase)) contentType = "application/xml";

            return File(stream, contentType, example.FileName);
        }

        [HttpDelete("examples/{exampleId:guid}")]
        public async Task<IActionResult> DeleteExample(Guid exampleId)
        {
            var example = await _context.DataObjectExamples.FirstOrDefaultAsync(e => e.PublicId == exampleId);
            if (example == null) return NotFound();

            await _fileStorage.DeleteFileAsync(example.FileStoragePath);
            _context.DataObjectExamples.Remove(example);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
