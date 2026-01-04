using IntegrationMapper.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace IntegrationMapper.Infrastructure.Data
{
    public class IntegrationMapperContext : DbContext
    {
        public IntegrationMapperContext(DbContextOptions<IntegrationMapperContext> options) : base(options)
        {
        }

        public DbSet<IntegrationSystem> IntegrationSystems { get; set; }
        public DbSet<DataObject> DataObjects { get; set; }
        public DbSet<FieldDefinition> FieldDefinitions { get; set; }
        public DbSet<MappingProject> MappingProjects { get; set; }
        public DbSet<MappingProfile> MappingProfiles { get; set; }
        public DbSet<FieldMapping> FieldMappings { get; set; }
        public DbSet<FieldMappingSource> FieldMappingSources { get; set; }
        public DbSet<DataObjectExample> DataObjectExamples { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // IntegrationSystem
            modelBuilder.Entity<IntegrationSystem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ExternalId).HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Category).HasMaxLength(100);
            });

            // DataObject
            modelBuilder.Entity<DataObject>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.SchemaType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.FileReference).HasMaxLength(2048);
                
                entity.HasOne(d => d.System)
                      .WithMany(p => p.DataObjects)
                      .HasForeignKey(d => d.SystemId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(d => d.Examples)
                      .WithOne(e => e.DataObject)
                      .HasForeignKey(e => e.DataObjectId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // FieldDefinition
            modelBuilder.Entity<FieldDefinition>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Path).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.DataType).HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(1000);

                entity.HasOne(d => d.DataObject)
                      .WithMany(p => p.Fields)
                      .HasForeignKey(d => d.DataObjectId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.ParentField)
                      .WithMany(p => p.Children)
                      .HasForeignKey(d => d.ParentFieldId)
                      .OnDelete(DeleteBehavior.Restrict); 
            });

            // MappingProject
            modelBuilder.Entity<MappingProject>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(1000); // Added
                entity.Property(e => e.CreatedDate).HasDefaultValueSql("GETUTCDATE()");
            });

            // MappingProfile
            modelBuilder.Entity<MappingProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);

                entity.HasOne(d => d.MappingProject)
                      .WithMany(p => p.Profiles)
                      .HasForeignKey(d => d.MappingProjectId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.SourceObject)
                      .WithMany()
                      .HasForeignKey(d => d.SourceObjectId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.TargetObject)
                      .WithMany()
                      .HasForeignKey(d => d.TargetObjectId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // FieldMapping
            modelBuilder.Entity<FieldMapping>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TransformationLogic).HasColumnType("nvarchar(max)");

                entity.HasOne(d => d.Profile)
                      .WithMany(p => p.Mappings)
                      .HasForeignKey(d => d.ProfileId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.SourceField)
                      .WithMany()
                      .HasForeignKey(d => d.SourceFieldId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(d => d.TargetField)
                      .WithMany()
                      .HasForeignKey(d => d.TargetFieldId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // FieldMappingSource
            modelBuilder.Entity<FieldMappingSource>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(d => d.FieldMapping)
                      .WithMany(p => p.Sources)
                      .HasForeignKey(d => d.FieldMappingId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(d => d.SourceField)
                      .WithMany()
                      .HasForeignKey(d => d.SourceFieldId)
                      .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
