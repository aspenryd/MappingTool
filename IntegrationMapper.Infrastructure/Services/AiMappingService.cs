using FuzzySharp;
using IntegrationMapper.Core.DTOs;
using IntegrationMapper.Core.Interfaces;

namespace IntegrationMapper.Infrastructure.Services
{
    public class AiMappingService : IAiMappingService
    {
        public Task<List<FieldMappingSuggestionDto>> SuggestMappingsAsync(List<FieldDefinitionDto> sourceFields, List<FieldDefinitionDto> targetFields, List<int> existingTargetIds)
        {
            var suggestions = new List<FieldMappingSuggestionDto>();
            var flattenedSource = FlattenFields(sourceFields);
            var flattenedTarget = FlattenFields(targetFields);

            // Filter out targets that are already mapped
            var availableTargets = flattenedTarget.Where(t => !existingTargetIds.Contains(t.Id)).ToList();

            var candidates = new List<(FieldDefinitionDto Source, FieldDefinitionDto Target, double Score)>();

            foreach (var target in availableTargets)
            {
                foreach (var source in flattenedSource)
                {
                    // 1. Name Match (Weighted most heavily)
                    double nameScore = Fuzz.WeightedRatio(target.Name, source.Name);

                    // 2. Path Context Match
                    // e.g. "Order/Customer/Name" vs "OrderInfo/Client/Name"
                    double pathScore = Fuzz.TokenSetRatio(target.Path, source.Path);

                    // Weighted Average (70% Name, 30% Path) - Adjust as needed
                    double totalScore = (nameScore * 0.7) + (pathScore * 0.3);

                    if (totalScore >= 70) // Threshold
                    {
                        candidates.Add((source, target, totalScore));
                    }
                }
            }

            // Greedy Selection for 1-to-1 Mapping
            var usedSourceIds = new HashSet<int>();
            var usedTargetIds = new HashSet<int>();

            // Sort by highest score first
            var storedCandidates = candidates.OrderByDescending(x => x.Score).ToList();

            foreach (var candidate in storedCandidates)
            {
                if (!usedSourceIds.Contains(candidate.Source.Id) && !usedTargetIds.Contains(candidate.Target.Id))
                {
                    suggestions.Add(new FieldMappingSuggestionDto
                    {
                        SourceFieldId = candidate.Source.Id,
                        TargetFieldId = candidate.Target.Id,
                        Confidence = candidate.Score / 100.0,
                        Reasoning = $"Match: '{candidate.Source.Name}' -> '{candidate.Target.Name}' (Score: {candidate.Score:F1}%)"
                    });

                    usedSourceIds.Add(candidate.Source.Id);
                    usedTargetIds.Add(candidate.Target.Id);
                }
            }

            return Task.FromResult(suggestions);
        }

        private List<FieldDefinitionDto> FlattenFields(List<FieldDefinitionDto> fields)
        {
            var flat = new List<FieldDefinitionDto>();
            foreach (var field in fields)
            {
                flat.Add(field);
                if (field.Children != null && field.Children.Any())
                {
                    flat.AddRange(FlattenFields(field.Children));
                }
            }
            return flat;
        }
    }
}
