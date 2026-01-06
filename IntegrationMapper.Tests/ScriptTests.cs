using Xunit;
using System.Diagnostics;
using System.IO;

namespace IntegrationMapper.Tests
{
    public class ScriptTests
    {
        [Fact]
        public void RunUpdateApiSpecScript_ShouldExecuteSuccessfully()
        {
            // Arrange
            var scriptPath = Path.GetFullPath(Path.Combine("..", "..", "..", "..", "IntegrationMapper.Api", "scripts", "UpdateApiSpec.ps1"));
            var startInfo = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -ExecutionPolicy Bypass -File \"{scriptPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // Act
            using var process = Process.Start(startInfo);
            process!.WaitForExit();
            var output = process.StandardOutput.ReadToEnd();
            var error = process.StandardError.ReadToEnd();

            // Assert
            Assert.True(process.ExitCode == 0, $"Script failed with exit code {process.ExitCode}. Error: {error}");
            Assert.Contains("Successfully updated OpenAPI spec", output);
        }
    }
}
