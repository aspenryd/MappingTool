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
                SystemId = dto.SystemId,
                Name = dto.Name,
                SchemaType = schemaType,
                FileReference = fileReference
            };

            _context.DataObjects.Add(dataObject);
            await _context.SaveChangesAsync();

            // 4. Save Fields
            // We need to set the DataObjectId and handle keys. 
            // Since we reused Code-First but maybe didn't set up complex graph saving perfectly for bulk insert with relationships?
            // Actually, if we add them to the context, EF Core should handle FKs if we set navigation properties or IDs.
            // But `fields` is a flat list potentially? No, the parser returns a flat list? 
            // Let's check parser. It adds ALL fields to the list, including children.
            // BUT, ParentField reference inside `FieldDefinition` objects in the list points to other objects in the *same* list.
            // EF Core is smart enough to handle this graph if we add them. 
            // However, we need to set DataObjectId for all of them.

            foreach (var field in fields)
            {
                field.DataObjectId = dataObject.Id;
                // ParentFieldId is implied by ParentField navigation property
            }

            _context.FieldDefinitions.AddRange(fields);
            await _context.SaveChangesAsync();

            return Ok(new SchemaUploadResponseDto
            {
                DataObjectId = dataObject.Id,
                Name = dataObject.Name,
                FieldCount = fields.Count
            });
        }
        
        [HttpGet("system/{systemId}")]
        public async Task<ActionResult<List<DataObjectDto>>> GetDataObjects(int systemId)
        {
             var objects = await _context.DataObjects
                .Where(d => d.SystemId == systemId)
                .Include(d => d.Examples)
                .ToListAsync();
                
            return Ok(objects.Select(d => new DataObjectDto
            {
                Id = d.Id,
                SystemId = d.SystemId,
                Name = d.Name,
                SchemaType = d.SchemaType,
                FileReference = d.FileReference,
                Examples = d.Examples.Select(e => new DataObjectExampleDto
                {
                    Id = e.Id,
                    FileName = e.FileName,
                    UploadedAt = e.UploadedAt
                }).ToList()
            }).ToList());
        }

        [HttpGet("{id}/content")]
        public async Task<IActionResult> GetSchemaContent(int id)
        {
            var dataObject = await _context.DataObjects.FindAsync(id);
            if (dataObject == null || string.IsNullOrEmpty(dataObject.FileReference))
                return NotFound();

            var stream = await _fileStorage.GetFileAsync(dataObject.FileReference);
            if (stream == null) return NotFound("File not found on storage");

            string contentType = dataObject.SchemaType == "XSD" ? "application/xml" : "application/json";
            return File(stream, contentType, Path.GetFileName(dataObject.FileReference));
        }
        [HttpPost("data-objects/{id}/examples")]
        public async Task<ActionResult<DataObjectExampleDto>> UploadExample(int id, [FromForm] IFormFile file)
        {
            var dataObject = await _context.DataObjects
                .Include(d => d.Fields)
                .FirstOrDefaultAsync(d => d.Id == id); // Include Fields for backfilling

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
                DataObjectId = id,
                FileName = file.FileName,
                FileStoragePath = fileReference,
                UploadedAt = DateTime.UtcNow
            };

            _context.DataObjectExamples.Add(example);
            await _context.SaveChangesAsync();

            return Ok(new DataObjectExampleDto
            {
                Id = example.Id,
                FileName = example.FileName,
                UploadedAt = example.UploadedAt
            });
        }

        [HttpGet("examples/{exampleId}/content")]
        public async Task<IActionResult> GetExampleContent(int exampleId)
        {
            var example = await _context.DataObjectExamples.FindAsync(exampleId);
            if (example == null) return NotFound();

            var stream = await _fileStorage.GetFileAsync(example.FileStoragePath);
            if (stream == null) return NotFound("File not found on storage");

            // Guess content type or default
            string contentType = "application/octet-stream";
            if (example.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) contentType = "application/json";
            else if (example.FileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase)) contentType = "application/xml";

            return File(stream, contentType, example.FileName);
        }

        [HttpDelete("examples/{exampleId}")]
        public async Task<IActionResult> DeleteExample(int exampleId)
        {
            var example = await _context.DataObjectExamples.FindAsync(exampleId);
            if (example == null) return NotFound();

            await _fileStorage.DeleteFileAsync(example.FileStoragePath);
            _context.DataObjectExamples.Remove(example);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
