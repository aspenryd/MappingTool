using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IntegrationMapper.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IntegrationSystems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExternalId = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntegrationSystems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DataObjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SystemId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SchemaType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FileReference = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataObjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DataObjects_IntegrationSystems_SystemId",
                        column: x => x.SystemId,
                        principalTable: "IntegrationSystems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FieldDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DataObjectId = table.Column<int>(type: "int", nullable: false),
                    ParentFieldId = table.Column<int>(type: "int", nullable: true),
                    Path = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DataType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExampleValue = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldDefinitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FieldDefinitions_DataObjects_DataObjectId",
                        column: x => x.DataObjectId,
                        principalTable: "DataObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FieldDefinitions_FieldDefinitions_ParentFieldId",
                        column: x => x.ParentFieldId,
                        principalTable: "FieldDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MappingProjects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    SourceObjectId = table.Column<int>(type: "int", nullable: false),
                    TargetObjectId = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MappingProjects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MappingProjects_DataObjects_SourceObjectId",
                        column: x => x.SourceObjectId,
                        principalTable: "DataObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MappingProjects_DataObjects_TargetObjectId",
                        column: x => x.TargetObjectId,
                        principalTable: "DataObjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FieldMappings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    SourceFieldId = table.Column<int>(type: "int", nullable: true),
                    TargetFieldId = table.Column<int>(type: "int", nullable: false),
                    TransformationLogic = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConfidenceScore = table.Column<double>(type: "float", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldMappings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FieldMappings_FieldDefinitions_SourceFieldId",
                        column: x => x.SourceFieldId,
                        principalTable: "FieldDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FieldMappings_FieldDefinitions_TargetFieldId",
                        column: x => x.TargetFieldId,
                        principalTable: "FieldDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FieldMappings_MappingProjects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "MappingProjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataObjects_SystemId",
                table: "DataObjects",
                column: "SystemId");

            migrationBuilder.CreateIndex(
                name: "IX_FieldDefinitions_DataObjectId",
                table: "FieldDefinitions",
                column: "DataObjectId");

            migrationBuilder.CreateIndex(
                name: "IX_FieldDefinitions_ParentFieldId",
                table: "FieldDefinitions",
                column: "ParentFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_FieldMappings_ProjectId",
                table: "FieldMappings",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_FieldMappings_SourceFieldId",
                table: "FieldMappings",
                column: "SourceFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_FieldMappings_TargetFieldId",
                table: "FieldMappings",
                column: "TargetFieldId");

            migrationBuilder.CreateIndex(
                name: "IX_MappingProjects_SourceObjectId",
                table: "MappingProjects",
                column: "SourceObjectId");

            migrationBuilder.CreateIndex(
                name: "IX_MappingProjects_TargetObjectId",
                table: "MappingProjects",
                column: "TargetObjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FieldMappings");

            migrationBuilder.DropTable(
                name: "FieldDefinitions");

            migrationBuilder.DropTable(
                name: "MappingProjects");

            migrationBuilder.DropTable(
                name: "DataObjects");

            migrationBuilder.DropTable(
                name: "IntegrationSystems");
        }
    }
}
