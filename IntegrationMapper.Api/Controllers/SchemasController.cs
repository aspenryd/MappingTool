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

        public SchemasController(
            IntegrationMapperContext context,
            IFileStorageService fileStorage,
            ISchemaParserService jsonSchemaParser,
            XsdSchemaParserService xsdSchemaParser)
        {
            _context = context;
            _fileStorage = fileStorage;
            _jsonSchemaParser = jsonSchemaParser;
            _xsdSchemaParser = xsdSchemaParser;
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
            List<FieldDefinition> fields;
            using (var stream = dto.File.OpenReadStream())
            {
                // Reset stream position if possible, or re-open. IFileStorageService might have consumed it?
                // Actually UploadFileAsync usually consumes. 
                // We should re-open or copy to memory if we need multiple reads, 
                // but here we can just read from the uploaded file again since IFormFile allows OpenReadStream multiple times usually 
                // OR we can read from the saved file if we wanted to be safe.
                // Let's rely on IFormFile.OpenReadStream() creating a new stream or the buffer being available.
                
                if (schemaType == "XSD")
                {
                    fields = await _xsdSchemaParser.ParseSchemaAsync(stream, "XSD");
                }
                else
                {
                    fields = await _jsonSchemaParser.ParseSchemaAsync(stream, "JSON");
                }
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
        public async Task<ActionResult<List<DataObject>>> GetDataObjects(int systemId)
        {
             var objects = await _context.DataObjects
                .Where(d => d.SystemId == systemId)
                .ToListAsync();
                
            return Ok(objects);
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
    }
}
